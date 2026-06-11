"use client";

import { useAuth } from "@remcostoeten/auth-drawer";
import Link from "next/link";

export default function HomePage() {
  const { openDrawer } = useAuth();

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
        Example app
      </p>
      <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-neutral-950">
        Passport.js, Express, and Auth Drawer
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600">
        An Express server handles authentication via Passport's local strategy
        and cookie sessions. The Next.js frontend uses{" "}
        <code className="rounded bg-neutral-200 px-1 py-0.5 font-mono text-[0.8rem]">
          createPassportAdapter
        </code>{" "}
        to bridge the two.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={openDrawer}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
        >
          Open auth drawer
        </button>
        <Link
          href="/dashboard"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 transition-colors hover:bg-white"
        >
          Dashboard
        </Link>
        <a
          href="https://auth-drawer.remcostoeten.nl/docs"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 transition-colors hover:bg-white"
        >
          Read the docs
        </a>
      </div>
      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "Cookie sessions",
            body: "express-session stores sessions in PostgreSQL via connect-pg-simple. No JWTs.",
          },
          {
            title: "Passport local strategy",
            body: "Email + password, hashed with Node's built-in scrypt. No native deps.",
          },
          {
            title: "Live session updates",
            body: "The adapter revalidates on sign-in, sign-out, and tab focus — no page reload needed.",
          },
        ].map((item) => (
          <article
            key={item.title}
            className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-sm font-semibold text-neutral-900">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{item.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
