import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rag-lab.local";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/privacy", "/terms", "/data-policy"],
        disallow: ["/api/", "/project/*/api"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
