import type { Metadata } from "next";
import Link from "next/link";
import { MOCK_AUTH_PROVIDERS } from "@/lib/providers/mock-auth-providers";

export const metadata: Metadata = {
  title: "Provider Examples",
  description:
    "Mock Auth Drawer examples for Supabase, Better Auth, Auth.js, Clerk, and custom auth backends.",
};

export default function ExamplesIndexPage() {
  return (
    <main className="scan-overlay min-h-screen bg-background px-4 py-12 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/docs"
          className="mb-8 inline-flex text-xs font-semibold text-foreground/48 transition-colors hover:text-foreground"
        >
          Back to docs
        </Link>
        <div className="mb-8 max-w-2xl">
          <p className="docs-eyebrow mb-2 text-[0.68rem] uppercase tracking-[0.16em] text-foreground/38">
            Auth providers
          </p>
          <h1 className="font-display text-4xl leading-none tracking-[-0.03em]">
            Mocked provider showcases
          </h1>
          <p className="mt-4 text-sm leading-6 text-foreground/58">
            These examples keep the UI and server boundaries real while mocking
            provider calls until backend credentials and callback URLs are set.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {MOCK_AUTH_PROVIDERS.map((provider) => (
            <Link
              key={provider.slug}
              href={`/examples/${provider.slug}`}
              className="group rounded-[7px] border border-foreground/10 bg-foreground/[0.025] p-5 transition-colors hover:border-foreground/24 hover:bg-foreground/[0.04]"
            >
              <p className="text-xs font-semibold text-foreground/42">
                {provider.label}
              </p>
              <h2 className="mt-2 font-display text-2xl text-foreground">
                {provider.name}
              </h2>
              <p className="mt-3 text-sm leading-6 text-foreground/58">
                {provider.description}
              </p>
              <span className="mt-5 inline-flex text-xs font-semibold text-foreground/50 transition-colors group-hover:text-foreground">
                Open mock example
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
