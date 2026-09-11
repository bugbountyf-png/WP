import type { MetadataRoute } from "next";
import { publicOrigin } from "@/lib/app-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app/", "/onboarding", "/api/"],
    },
    sitemap: `${publicOrigin()}/sitemap.xml`,
  };
}
