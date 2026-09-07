import "./globals.css";

export const metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  title: "Eugene Code — разработка сайтов",
  description:
    "Разработка лендингов, сайтов для бизнеса и доработка существующих проектов.",
  alternates: process.env.NEXT_PUBLIC_SITE_URL
    ? { canonical: "/" }
    : undefined,
  openGraph: {
    type: "website",
    locale: "ru_RU",
    title: "Eugene Code — разработка сайтов",
    description:
      "Простые и современные сайты для бизнеса и проектов.",
    url: process.env.NEXT_PUBLIC_SITE_URL || undefined
  },
  twitter: {
    card: "summary_large_image",
    title: "Eugene Code — разработка сайтов",
    description:
      "Простые и современные сайты для бизнеса и проектов."
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
