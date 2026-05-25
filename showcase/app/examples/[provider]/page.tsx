import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RedirectToDocs } from "@/components/redirect-to-docs";

const PROVIDER_DOC_ANCHORS: Record<string, string> = {
  supabase: "sdk-supabase",
  "better-auth": "sdk-better-auth",
  "auth-js": "sdk-next-auth",
  clerk: "sdk-clerk",
  "custom-backend": "sdk-custom-jwt",
};

type ProviderPageProps = {
  params: Promise<{
    provider: string;
  }>;
};

export function generateStaticParams() {
  return Object.keys(PROVIDER_DOC_ANCHORS).map((provider) => ({ provider }));
}

export async function generateMetadata({
  params,
}: ProviderPageProps): Promise<Metadata> {
  const { provider: slug } = await params;
  const anchor = PROVIDER_DOC_ANCHORS[slug];
  if (!anchor) return {};

  return {
    title: "Provider Example",
    description: "Redirecting to SDK adapter docs.",
    robots: { index: false, follow: true },
  };
}

export default async function ProviderExamplePage({ params }: ProviderPageProps) {
  const { provider: slug } = await params;
  const anchor = PROVIDER_DOC_ANCHORS[slug];
  if (!anchor) notFound();

  return <RedirectToDocs hash={anchor} />;
}
