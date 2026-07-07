import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#04080f",
    theme_color: "#7000ff",
    orientation: "portrait-primary",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/anshFavicon.png",
        sizes: "any",
        type: "image/png",
      },
      {
        src: "/logoAnshapps.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
