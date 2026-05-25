"use client";

import { Analytics } from "@remcostoeten/analytics";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { AuthDrawerLab } from "@/components/debug/auth-drawer-lab";
import { DocsPage } from "@/components/docs/docs-page";
import { AppNav } from "@/components/app-nav";

type AppView = "lab" | "docs";

type ShowcaseAppProps = {
  initialView?: AppView;
};

export function ShowcaseApp({ initialView = "docs" }: ShowcaseAppProps) {
  const [view, setView] = useState<AppView>(initialView);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("view");
    if (v === "playground" || v === "lab") setView("lab");
    else if (v === "docs") setView("docs");
    else if (params.has("showcase") || params.has("config")) setView("lab");
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const params = new URLSearchParams(window.location.search);
    params.set("view", view === "lab" ? "playground" : "docs");
    const search = params.toString();
    const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;

    if (
      nextUrl !==
      `${window.location.pathname}${window.location.search}${window.location.hash}`
    ) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [view, mounted]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <Analytics
        projectId="modal"
        ingestUrl="https://ingestion.remcostoeten.nl"
      />
      <AppNav showSearch={view === "docs"} />
      <main className="scan-overlay pt-9">
        {view === "lab" ? <AuthDrawerLab /> : <DocsPage />}
      </main>
    </ThemeProvider>
  );
}
