"use client";

import Link from "next/link";
import { useAuth } from "@remcostoeten/auth-drawer";

export function SiteHeader() {
  const { user, isPending, openDrawer, signOut } = useAuth();

  return (
    <header className="border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-sm font-semibold tracking-tight text-neutral-900">
          Auth Drawer · Custom JWT
        </Link>
        <div className="flex items-center gap-3">
          {isPending ? (
            <span className="text-xs text-neutral-500">Checking session…</span>
          ) : user ? (
            <>
              <span className="hidden text-xs text-neutral-600 sm:inline">
                {user.email ?? user.name}
              </span>
              <Link
                href="/dashboard"
                className="text-xs font-medium text-neutral-700 underline-offset-4 hover:underline"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 transition-colors hover:bg-neutral-50"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={openDrawer}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition-transform active:scale-[0.98]"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
