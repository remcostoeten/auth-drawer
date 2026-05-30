"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { DocsNavSearch } from "@/components/docs/docs-nav-search";
import { PackageMetaLinks } from "@/components/package-meta-links";

function PlaygroundDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 px-2.5 py-1 text-[0.68rem] font-medium text-foreground/48 transition-colors hover:text-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
      >
        Playground
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className={open ? "rotate-180" : ""}>
          <path d="M1 3l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-44 rounded-[4px] border border-foreground/10 bg-background py-1 shadow-lg">
          <Link
            href="/playground/windows-xp"
            onClick={() => setOpen(false)}
            className="block px-3 py-1.5 text-xs text-foreground/70 transition-colors hover:bg-foreground/8 hover:text-foreground"
          >
            Windows XP
          </Link>
          <Link
            href="/playground/medium-paywall-example"
            onClick={() => setOpen(false)}
            className="block px-3 py-1.5 text-xs text-foreground/70 transition-colors hover:bg-foreground/8 hover:text-foreground"
          >
            Medium Paywall
          </Link>
          <Link
            href="/?view=playground"
            onClick={() => setOpen(false)}
            className="block px-3 py-1.5 text-xs text-foreground/48 transition-colors hover:bg-foreground/8 hover:text-foreground"
          >
            Legacy Lab
          </Link>
        </div>
      )}
    </div>
  );
}

type AppNavProps = {
  showSearch?: boolean;
};

export function AppNav({ showSearch }: AppNavProps) {
  return (
    <nav className="fixed top-0 right-0 left-0 z-[200] flex h-9 items-center gap-2 border-b border-foreground/8 bg-background/85 px-3">
      <PlaygroundDropdown />
      <Link
        href="/?view=docs"
        className="px-2.5 py-1 text-[0.68rem] font-medium text-foreground/48 transition-colors hover:text-foreground/70"
      >
        Docs
      </Link>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        {showSearch && <DocsNavSearch />}
        <PackageMetaLinks />
      </div>
    </nav>
  );
}
