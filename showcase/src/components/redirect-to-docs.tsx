"use client";

import { useEffect } from "react";

type RedirectToDocsProps = {
  hash?: string;
};

export function RedirectToDocs({ hash }: RedirectToDocsProps) {
  useEffect(() => {
    window.location.replace(`/docs${hash ? `#${hash}` : ""}`);
  }, [hash]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-sm text-foreground/50">
      Redirecting to docs…
    </main>
  );
}
