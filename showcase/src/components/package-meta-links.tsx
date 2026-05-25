import { Github } from "lucide-react";
import {
  AUTH_DRAWER_GITHUB_URL,
  AUTH_DRAWER_NPM_URL,
  AUTH_DRAWER_VERSION,
} from "@/lib/package-meta";

type PackageMetaLinksProps = {
  variant?: "nav" | "sidebar";
};

const linkClass =
  "transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20";

export function PackageMetaLinks({ variant = "nav" }: PackageMetaLinksProps) {
  if (variant === "sidebar") {
    return (
      <div className="mb-7 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-foreground/10 pb-5">
        <a
          href={AUTH_DRAWER_NPM_URL}
          target="_blank"
          rel="noreferrer"
          className={`font-mono text-[0.68rem] text-foreground/42 ${linkClass}`}
        >
          v{AUTH_DRAWER_VERSION}
        </a>
        <a
          href={AUTH_DRAWER_GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center gap-1 text-[0.68rem] font-medium text-foreground/42 ${linkClass}`}
        >
          <Github size={12} aria-hidden="true" />
          GitHub
        </a>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <a
        href={AUTH_DRAWER_NPM_URL}
        target="_blank"
        rel="noreferrer"
        className={`font-mono px-2 py-1 text-[0.62rem] text-foreground/42 ${linkClass}`}
      >
        v{AUTH_DRAWER_VERSION}
      </a>
      <a
        href={AUTH_DRAWER_GITHUB_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="View source on GitHub"
        className={`inline-flex h-7 w-7 items-center justify-center text-foreground/42 ${linkClass}`}
      >
        <Github size={13} aria-hidden="true" />
      </a>
    </div>
  );
}
