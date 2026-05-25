import type { MetadataRoute } from "next";
import { MOCK_AUTH_PROVIDERS } from "@/lib/providers/mock-auth-providers";

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
    {
      url: `${baseUrl}/examples`,
      lastModified: new Date(),
    },
    ...MOCK_AUTH_PROVIDERS.map((provider) => ({
      url: `${baseUrl}/examples/${provider.slug}`,
      lastModified: new Date(),
    })),
  ];
}
