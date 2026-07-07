import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/login",
          "/signup",
          "/privacy",
          "/terms",
          "/favicon.png",
          "/icon-48.png",
          "/icon-192.png",
          "/logoAnshapps.png",
        ],
        disallow: [
          "/api/",
          "/adminpanel/",
          "/dashboard/",
          "/attendance/",
          "/leave/",
          "/settings/",
          "/team/",
          "/calendar/",
          "/reports/",
          "/activity/",
          "/announcements/",
          "/workspace/",
          "/help/",
          "/onboarding/",
          "/auth/",
          "/forgot-password/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
