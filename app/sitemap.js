export default function sitemap() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) return [];

  return [
    {
      url: siteUrl,
      changeFrequency: "monthly",
      priority: 1
    }
  ];
}
