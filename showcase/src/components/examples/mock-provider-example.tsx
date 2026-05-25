"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AuthDrawer,
  DEFAULT_CONFIG,
  type AuthAdapter,
  type AuthConfig,
} from "@/components/auth/auth-drawer";
import { createMockAdapter } from "@remcostoeten/auth-drawer/adapters/mock";
import type { MockAuthProvider } from "@/lib/providers/mock-auth-providers";

type MockProviderExampleProps = {
  provider: MockAuthProvider;
};

function mergeProviderConfig(providerConfig: Partial<AuthConfig>): AuthConfig {
  return {
    ...DEFAULT_CONFIG,
    ...providerConfig,
    ui: {
      ...DEFAULT_CONFIG.ui,
      ...providerConfig.ui,
      copy: {
        ...DEFAULT_CONFIG.ui.copy,
        ...providerConfig.ui?.copy,
        login: {
          ...DEFAULT_CONFIG.ui.copy.login,
          ...providerConfig.ui?.copy?.login,
        },
        fields: {
          ...DEFAULT_CONFIG.ui.copy.fields,
          ...providerConfig.ui?.copy?.fields,
          email: {
            ...DEFAULT_CONFIG.ui.copy.fields.email,
            ...providerConfig.ui?.copy?.fields?.email,
          },
        },
      },
      auth: {
        ...DEFAULT_CONFIG.ui.auth,
        ...providerConfig.ui?.auth,
      },
    },
  };
}

export function MockProviderExample({ provider }: MockProviderExampleProps) {
  const [open, setOpen] = useState(false);
  const adapter = useMemo(
    () =>
      createMockAdapter() as AuthAdapter,
    [],
  );
  const config = useMemo<AuthConfig>(
    () => ({
      ...mergeProviderConfig(provider.config),
    }),
    [provider],
  );

  return (
    <main className="scan-overlay min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-6 sm:p-8">
          <Link
            href="/examples"
            className="mb-7 inline-flex text-xs font-semibold text-foreground/42 transition-colors hover:text-foreground"
          >
            Back to examples
          </Link>
          <p className="docs-eyebrow mb-2 text-[0.68rem] uppercase tracking-[0.16em] text-foreground/38">
            {provider.label}
          </p>
          <h1 className="font-display text-4xl leading-none tracking-[-0.03em] sm:text-5xl">
            {provider.name} auth drawer
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-foreground/58">
            {provider.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-10 items-center rounded-[5px] bg-foreground px-4 text-sm font-semibold text-background transition-transform active:scale-[0.98]"
            >
              Open mocked drawer
            </button>
            <Link
              href="/docs#api"
              className="inline-flex h-10 items-center rounded-[5px] border border-foreground/10 px-4 text-sm font-semibold text-foreground/62 transition-colors hover:border-foreground/22 hover:text-foreground"
            >
              View API docs
            </Link>
          </div>
        </section>

        <aside className="space-y-3">
          <div className="rounded-[8px] border border-foreground/10 bg-background p-5">
            <h2 className="font-display text-xl">Env checklist</h2>
            <ul className="mt-4 space-y-2">
              {provider.env.map((item) => (
                <li
                  key={item}
                  className="font-mono text-[0.72rem] text-foreground/58"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[8px] border border-foreground/10 bg-background p-5">
            <h2 className="font-display text-xl">Callback routes</h2>
            <ul className="mt-4 space-y-2">
              {provider.callbacks.map((item) => (
                <li
                  key={item}
                  className="font-mono text-[0.72rem] text-foreground/58"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[8px] border border-foreground/10 bg-background p-5">
            <h2 className="font-display text-xl">Server notes</h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-foreground/58">
              {provider.serverNotes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <AuthDrawer
        adapter={adapter}
        config={config}
        open={open}
        hideTrigger
        onOpenChange={setOpen}
      />
    </main>
  );
}
