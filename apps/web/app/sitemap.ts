import type { MetadataRoute } from "next";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://insightxi.app"
).replace(/\/$/, "");

/** Public, crawlable routes. User-specific surfaces are intentionally omitted. */
const ROUTES = [
  "/",
  "/dashboard",
  "/fixtures",
  "/results",
  "/leagues",
  "/teams",
  "/predictions",
  "/live",
  "/historical",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified,
    changeFrequency: route === "/" ? "weekly" : "daily",
    priority: route === "/" ? 1 : 0.7,
  }));
}
