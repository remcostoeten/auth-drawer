import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  MOCK_AUTH_PROVIDERS,
  getMockAuthProvider,
} from "@/lib/providers/mock-auth-providers";
import { MockProviderExample } from "@/components/examples/mock-provider-example";

type ProviderPageProps = {
  params: Promise<{
    provider: string;
  }>;
};

export function generateStaticParams() {
  return MOCK_AUTH_PROVIDERS.map((provider) => ({
    provider: provider.slug,
  }));
}

export async function generateMetadata({
  params,
}: ProviderPageProps): Promise<Metadata> {
  const { provider: slug } = await params;
  const provider = getMockAuthProvider(slug);
  if (!provider) return {};

  return {
    title: `${provider.name} Example`,
    description: provider.description,
  };
}

export default async function ProviderExamplePage({ params }: ProviderPageProps) {
  const { provider: slug } = await params;
  const provider = getMockAuthProvider(slug);
  if (!provider) notFound();

  return <MockProviderExample provider={provider} />;
}
