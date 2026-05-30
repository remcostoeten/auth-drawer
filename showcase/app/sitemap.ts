import type { MetadataRoute } from "next";

const baseUrl = "https://auth-drawer.remcostoeten.nl";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/playground`,
      lastModified: new Date(),
    },
  ];
}
