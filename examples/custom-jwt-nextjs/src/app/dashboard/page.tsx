"use client";

import Link from "next/link";
import { useAuth } from "@remcostoeten/auth-drawer";

export default function DashboardPage() {
  const { user, isPending, openDrawer } = useAuth();

  if (isPending) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16">
        <p className="text-sm text-neutral-600">Loading session…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-neutral-600">
          You are signed out. Open the auth drawer to create an account or sign in.
        </p>
        <button
          type="button"
          onClick={openDrawer}
          className="mt-6 rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Open auth drawer
        </button>
        <p className="mt-6 text-sm">
          <Link href="/" className="text-neutral-700 underline-offset-4 hover:underline">
            Back home
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
        Signed in
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Welcome{user.name ? `, ${user.name}` : ""}
      </h1>
      <p className="mt-3 text-sm text-neutral-600">{user.email}</p>
      <div className="mt-8 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-900">Session snapshot</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Resolved from the JWT via <code className="font-mono">GET /api/auth/me</code>.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-md bg-neutral-950 p-4 text-xs leading-6 text-neutral-100">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
      <p className="mt-6 text-sm">
        <Link href="/" className="text-neutral-700 underline-offset-4 hover:underline">
          Back home
        </Link>
      </p>
    </main>
  );
}
