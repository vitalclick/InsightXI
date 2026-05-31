import type { MetadataRoute } from "next";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://insightxi.app"
).replace(/\/$/, "");

/**
 * robots.txt. Authenticated, user-specific surfaces (account, premium checkout,
 * token-bearing links) are disallowed; public marketing and legal pages are
 * crawlable.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/premium", "/reset-password", "/verify-email"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
