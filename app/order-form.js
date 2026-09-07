"use client";

import { useRef, useState } from "react";

export default function OrderForm() {
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);

  async function submitOrder(event) {
    event.preventDefault();

    if (submittingRef.current) return;

    submittingRef.current = true;

    const formElement = event.currentTarget;
    const data = Object.fromEntries(new FormData(formElement).entries());
    const idempotencyKey = crypto.randomUUID();

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify(data)
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error || "Не удалось отправить заявку."
        );
      }

      formElement.reset();
      setStatus({
        type: "success",
        message: "Заявка отправлена. Я напишу тебе в Telegram."
      });
    } catch {
      setStatus({
        type: "error",
        message: "Не удалось отправить заявку. Попробуй ещё раз."
      });
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submitOrder} aria-busy={loading}>
      <label>
        Имя
        <input
          name="name"
          required
          autoComplete="name"
          placeholder="Твоё имя"
          maxLength="80"
        />
      </label>

      <label>
        Telegram
        <input
          name="telegram"
          required
          autoComplete="username"
          placeholder="@username"
          maxLength="80"
        />
      </label>

      <label>
        Что нужно
        <select name="service" required defaultValue="">
          <option value="" disabled>Выбери услугу</option>
          <option>Лендинг</option>
          <option>Сайт для бизнеса</option>
          <option>Доработка сайта</option>
          <option>Другое</option>
        </select>
      </label>

      <label>
        Бюджет
        <input
          name="budget"
          placeholder="Например, до 20 000 ₽"
          maxLength="100"
        />
      </label>

      <label>
        Описание
        <textarea
          name="description"
          required
          rows="6"
          placeholder="Коротко расскажи, какой сайт нужен"
          maxLength="3000"
        />
      </label>

      <input
        name="website"
        tabIndex="-1"
        autoComplete="off"
        aria-hidden="true"
        className="honeypot"
      />

      <button type="submit" className="submit" disabled={loading}>
        {loading ? "Отправляю..." : "Отправить заявку"}
      </button>

      {status.message && (
        <p
          className={`status ${status.type}`}
          role={status.type === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {status.message}
        </p>
      )}
    </form>
  );
}
