import type { MetadataRoute } from "next";

/**
 * Robots.txt configuration for SEO optimization
 * Allows all search engines to crawl public pages
 * Disallows crawling of API routes and admin areas
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://afenda.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/admin",
        ]
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/dashboard/*", "/admin/*", "/auth/*"],
        crawlDelay: 0,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
