import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
  const appUrl = process.env.NODE_ENV === "production"
    ? configuredUrl && !configuredUrl.includes("localhost")
      ? configuredUrl
      : "https://cal.heyclift.xyz"
    : configuredUrl || "http://localhost:3000";

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/dashboard/',
    },
    sitemap: `${appUrl.replace(/\/$/, "")}/sitemap.xml`,
  }
}
