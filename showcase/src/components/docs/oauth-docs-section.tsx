import { Play } from "lucide-react";
import type { ReactNode } from "react";
import {
  OAUTH_PROVIDER_IDS,
  defaultLabelForOAuthProvider,
} from "@/components/auth/auth-drawer";
import { CodeBlock } from "../code/server-code-block";

const OAUTH_DEFAULT_SNIPPET = `ui: {
  auth: {
    providers: ["github", "google"],
  },
}`;

const OAUTH_OVERFLOW_SNIPPET = `ui: {
  auth: {
    providers: ["github", "google", "apple", "discord", "tiktok"],
    oauthOverflow: {
      visibleCount: 2,
      showPreviewIcons: true,
    },
  },
  copy: {
    oauth: {
      showAllSocial: "Show all social methods",
      hideAllSocial: "Show fewer social methods",
    },
  },
}`;

type OAuthVariantCardProps = {
  title: string;
  description: ReactNode;
  snippet: string;
  previewLabel: string;
  onPreview: () => void;
  primaryPreview?: boolean;
};

function OAuthVariantCard({
  title,
  description,
  snippet,
  previewLabel,
  onPreview,
  primaryPreview = false,
}: OAuthVariantCardProps) {
  return (
    <article className="overflow-hidden rounded-[8px] border border-foreground/10 bg-foreground/[0.02]">
      <div className="flex flex-col gap-3 border-b border-foreground/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1 max-w-xl text-sm leading-6 text-foreground/58">{description}</p>
        </div>
        <button
          type="button"
          onClick={onPreview}
          className={
            primaryPreview
              ? "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[5px] bg-foreground px-3.5 text-sm font-semibold text-background transition-transform active:scale-[0.98]"
              : "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[5px] border border-foreground/10 bg-background px-3.5 text-sm font-semibold text-foreground/68 transition-colors hover:border-foreground/22 hover:text-foreground"
          }
        >
          <Play size={13} aria-hidden="true" />
          {previewLabel}
        </button>
      </div>
      <div className="bg-[#0b0b0c]/40 px-1 pb-1 pt-0">
        <CodeBlock lang="ts" embedded>
          {snippet}
        </CodeBlock>
      </div>
    </article>
  );
}

type Props = {
  onPreviewDefault: () => void;
  onPreviewOverflow: () => void;
};

export function OAuthDocsSection({ onPreviewDefault, onPreviewOverflow }: Props) {
  return (
    <>
      <p className="max-w-2xl text-sm leading-6 text-foreground/58">
        Enable built-in providers via{" "}
        <code className="font-mono text-[0.72rem]">ui.auth.providers</code>.
        Array order is display order. The adapter handles provider routing;
        the drawer only renders buttons, overflow, and labels.
      </p>

      <div className="mt-5">
        <p className="docs-label mb-2 text-[0.66rem] font-normal uppercase text-foreground/42">
          Built-in providers
        </p>
        <ul className="flex flex-wrap gap-2">
          {OAUTH_PROVIDER_IDS.map((provider) => (
            <li
              key={provider}
              className="rounded-[5px] border border-foreground/10 bg-background px-2.5 py-1 text-[0.72rem] font-medium text-foreground/62"
            >
              {defaultLabelForOAuthProvider(provider)}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 space-y-5">
        <OAuthVariantCard
          title="Two providers"
          description={
            <>
              Default setup from{" "}
              <code className="font-mono text-[0.72rem]">DEFAULT_CONFIG</code>.
              Both buttons stay visible — no disclosure.
            </>
          }
          snippet={OAUTH_DEFAULT_SNIPPET}
          previewLabel="Preview"
          onPreview={onPreviewDefault}
        />

        <OAuthVariantCard
          title="Social overflow"
          description={
            <>
              More than{" "}
              <code className="font-mono text-[0.72rem]">oauthOverflow.visibleCount</code>{" "}
              providers (default 2). Extras collapse behind a disclosure with
              optional icon previews. Customize labels via{" "}
              <code className="font-mono text-[0.72rem]">ui.copy.oauth</code>.
            </>
          }
          snippet={OAUTH_OVERFLOW_SNIPPET}
          previewLabel="Preview overflow"
          onPreview={onPreviewOverflow}
          primaryPreview
        />
      </div>

      <p className="mt-6 text-sm text-foreground/50">
        Full prop reference:{" "}
        <a
          href="#api-oauth"
          className="text-foreground/72 underline underline-offset-4 transition-colors hover:text-foreground"
        >
          OAuth API
        </a>
        .
      </p>
    </>
  );
}
