export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;
const MAX_MESSAGE_LENGTH = 4096;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;

const allowedServices = new Set([
  "Лендинг",
  "Сайт для бизнеса",
  "Доработка сайта",
  "Другое"
]);

const rateLimitStore = globalThis.__eugeneOrderRateLimit ??=
  new Map();
const idempotencyStore = globalThis.__eugeneOrderIdempotency ??=
  new Map();

function jsonError(message, status, headers) {
  return Response.json(
    { error: message },
    { status, headers }
  );
}

function getClientKey(request) {
  const netlifyIp = request.headers.get("x-nf-client-connection-ip");

  if (netlifyIp) return netlifyIp;

  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",").pop()?.trim() || "unknown";
}

function isRateLimited(key) {
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || now - current.startedAt >= RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(key, { startedAt: now, count: 1 });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX;
}

function clean(value) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pruneStore(store) {
  const now = Date.now();

  for (const [key, entry] of store) {
    if (now - entry.startedAt >= RATE_LIMIT_WINDOW_MS) {
      store.delete(key);
    }
  }
}

export async function POST(request) {
  const clientKey = getClientKey(request);

  pruneStore(rateLimitStore);
  pruneStore(idempotencyStore);

  if (isRateLimited(clientKey)) {
    return jsonError(
      "Слишком много запросов. Попробуй позже.",
      429,
      { "Retry-After": "60" }
    );
  }

  const origin = request.headers.get("origin");

  if (origin && origin !== new URL(request.url).origin) {
    return jsonError("Недопустимый источник запроса.", 403);
  }

  const contentType = request.headers.get("content-type") || "";

  if (!contentType.toLowerCase().startsWith("application/json")) {
    return jsonError("Ожидается application/json.", 415);
  }

  const declaredLength = Number(request.headers.get("content-length"));

  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return jsonError("Слишком большой запрос.", 413);
  }

  let rawBody;

  try {
    rawBody = await request.text();
  } catch {
    return jsonError("Не удалось прочитать запрос.", 400);
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return jsonError("Слишком большой запрос.", 413);
  }

  let body;

  try {
    body = JSON.parse(rawBody);
  } catch {
    return jsonError("Некорректный JSON.", 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonError("Некорректные данные.", 400);
  }

  if (body.website !== undefined && typeof body.website !== "string") {
    return jsonError("Некорректные данные формы.", 400);
  }

  if (body.website?.trim()) {
    return Response.json({ ok: true });
  }

  const requiredFields = ["name", "telegram", "service", "description"];

  if (requiredFields.some((field) => typeof body[field] !== "string")) {
    return jsonError("Некорректные данные формы.", 400);
  }

  const name = clean(body.name);
  const telegram = clean(body.telegram);
  const service = clean(body.service);
  const description = clean(body.description);
  const budget =
    body.budget === undefined
      ? ""
      : typeof body.budget === "string"
        ? clean(body.budget)
        : null;

  if (
    !name ||
    !telegram ||
    !service ||
    !description ||
    budget === null ||
    !allowedServices.has(service) ||
    name.length > 80 ||
    telegram.length > 80 ||
    service.length > 40 ||
    budget.length > 100 ||
    description.length > 3000
  ) {
    return jsonError("Проверьте заполненные поля.", 400);
  }

  const idempotencyKey = request.headers.get("idempotency-key")?.trim();

  if (idempotencyKey && idempotencyKey.length > 128) {
    return jsonError("Некорректный ключ запроса.", 400);
  }

  if (idempotencyKey) {
    const idempotencyId = `${clientKey}:${idempotencyKey}`;

    if (idempotencyStore.has(idempotencyId)) {
      return jsonError("Заявка уже обрабатывается или была отправлена.", 409);
    }

    idempotencyStore.set(idempotencyId, { startedAt: Date.now() });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) {
    return jsonError("Сервис временно недоступен.", 500);
  }

  const text = [
    "🆕 <b>Новая заявка — Eugene Code</b>",
    "",
    `👤 <b>Имя:</b> ${escapeHtml(name)}`,
    `💬 <b>Telegram:</b> ${escapeHtml(telegram)}`,
    `🧩 <b>Услуга:</b> ${escapeHtml(service)}`,
    `💰 <b>Бюджет:</b> ${escapeHtml(budget || "не указан")}`,
    "",
    "<b>Описание:</b>",
    escapeHtml(description)
  ].join("\n");

  if (text.length > MAX_MESSAGE_LENGTH) {
    return jsonError("Заявка слишком длинная.", 400);
  }

  let response;

  try {
    response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true
        })
      }
    );
  } catch (error) {
    return jsonError(
      error?.name === "TimeoutError"
        ? "Telegram не ответил вовремя."
        : "Telegram временно недоступен.",
      error?.name === "TimeoutError" ? 504 : 502
    );
  }

  const telegramResult = await response.json().catch(() => null);

  if (!response.ok || telegramResult?.ok !== true) {
    return jsonError(
      "Не удалось отправить заявку в Telegram.",
      502
    );
  }

  return Response.json({ ok: true });
}
