"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) {
      setError("Missing reset token. Use the link from your reset email.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    setError(null);

    // The drawer's forgot-password flow issues the token; this page completes
    // the reset by posting it straight to the REST endpoint.
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: password }),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    setPending(false);

    if (!res.ok) {
      setError(data.message ?? "Could not reset password.");
      return;
    }

    setMessage("Password updated. You can sign in now.");
  }

  if (!token) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
        <p className="mt-3 text-sm leading-7 text-neutral-600">
          Open the link from your reset email. This page expects a{" "}
          <code className="rounded bg-neutral-200 px-1 py-0.5 font-mono text-[0.8rem]">token</code>{" "}
          query parameter.
        </p>
        <p className="mt-6 text-sm">
          <Link href="/" className="text-neutral-700 underline-offset-4 hover:underline">
            Back home
          </Link>
        </p>
      </main>
    );
  }

  if (message) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Password updated</h1>
        <p className="mt-3 text-sm leading-7 text-neutral-600">{message}</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Back home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-neutral-800">
          New password
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            autoComplete="new-password"
          />
        </label>
        <label className="block text-sm font-medium text-neutral-800">
          Confirm password
          <input
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            autoComplete="new-password"
          />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Update password"}
        </button>
      </form>
      <p className="mt-6 text-sm">
        <Link href="/" className="text-neutral-700 underline-offset-4 hover:underline">
          Back home
        </Link>
      </p>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-4 py-16">
          <p className="text-sm text-neutral-600">Loading…</p>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
