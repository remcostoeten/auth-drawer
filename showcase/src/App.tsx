import { Analytics } from "@remcostoeten/analytics";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { AuthDrawerLab } from "@/components/debug/auth-drawer-lab";
import { DocsPage } from "@/components/docs/docs-page";

type AppView = "lab" | "docs";

function getInitialView(): AppView {
  if (typeof window === "undefined") return "docs";

  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");
  if (view === "playground" || view === "lab") return "lab";
  if (view === "docs") return "docs";
  if (params.has("showcase") || params.has("config")) return "lab";

  return "docs";
}

const App = () => {
  const [view, setView] = useState<AppView>(() => getInitialView());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    params.set("view", view === "lab" ? "playground" : "docs");
    const search = params.toString();
    const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;

    if (nextUrl !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [view]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <Analytics projectId="modal" ingestUrl="https://ingestion.remcostoeten.nl" />
      <nav className="fixed top-0 right-0 left-0 z-[200] flex h-9 items-center gap-2 border-b border-foreground/8 bg-background/85 px-3">
        <button
          type="button"
          onClick={() => setView("lab")}
          className={
            view === "lab"
              ? "font-display bg-foreground/13 px-2.5 py-1 text-[0.68rem] font-semibold text-foreground"
              : "px-2.5 py-1 text-[0.68rem] font-medium text-foreground/48 transition-colors hover:text-foreground/70"
          }
        >
          Playground
        </button>
        <button
          type="button"
          onClick={() => setView("docs")}
          className={
            view === "docs"
              ? "font-display bg-foreground/13 px-2.5 py-1 text-[0.68rem] font-semibold text-foreground"
              : "px-2.5 py-1 text-[0.68rem] font-medium text-foreground/48 transition-colors hover:text-foreground/70"
          }
        >
          Docs
        </button>
        <div className="flex-1" />
        <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-foreground/28">
          auth-drawer
        </span>
      </nav>
      <main className="scan-overlay pt-9">{view === "lab" ? <AuthDrawerLab /> : <DocsPage />}</main>
    </ThemeProvider>
  );
};

export default App;
