import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Playground",
  description: "Auth Drawer playground examples.",
};

export default function PlaygroundIndexPage() {
  return (
    <main className="scan-overlay flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl leading-none tracking-[-0.03em]">
          Playground
        </h1>
        <p className="mt-3 text-sm leading-6 text-foreground/58">
          Choose an example to explore.
        </p>
        <div className="mt-8 grid gap-3">
          <Link
            href="/playground/windows-xp"
            className="group rounded-[7px] border border-foreground/10 bg-foreground/[0.025] p-5 text-left transition-colors hover:border-foreground/24 hover:bg-foreground/[0.04]"
          >
            <h2 className="font-display text-xl text-foreground">
              Windows XP
            </h2>
            <p className="mt-2 text-sm leading-6 text-foreground/58">
              Boot screen, login, and desktop — with Auth Drawer on login.
            </p>
          </Link>
          <Link
            href="/playground/medium-paywall-example"
            className="group rounded-[7px] border border-foreground/10 bg-foreground/[0.025] p-5 text-left transition-colors hover:border-foreground/24 hover:bg-foreground/[0.04]"
          >
            <h2 className="font-display text-xl text-foreground">
              Medium Paywall
            </h2>
            <p className="mt-2 text-sm leading-6 text-foreground/58">
              Medium-style article with scroll-triggered auth drawer.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
