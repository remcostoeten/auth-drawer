import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  FileText,
  FolderOpen,
  Terminal,
} from "lucide-react";
import { CodeBlock } from "../code/server-code-block";
import {
  ADAPTER_CONTRACT,
  BETTER_AUTH_STEPS,
  CLERK_STEPS,
  NEXT_AUTH_STEPS,
  SDK_DOCS,
  SNIPPET_FILENAMES,
  SUPABASE_STEPS,
} from "./sdk-docs-data";
import type { GuideStep, GuideStepFile } from "./sdk-docs-data";

type BetterAuthSetupVariant = "prisma" | "drizzle";

type SetupTreeItem = {
  id: string;
  label: string;
  path: string;
  kind: "command" | "file";
  lang: string;
  code: string;
  description: string;
};

function getBetterAuthSetupTree(variant: BetterAuthSetupVariant): SetupTreeItem[] {
  const installStep = BETTER_AUTH_STEPS.find((step) => step.id === "ba-install");
  const envStep = BETTER_AUTH_STEPS.find((step) => step.id === "ba-env");
  const schemaStep = BETTER_AUTH_STEPS.find((step) => step.id === "ba-schema");
  const serverStep = BETTER_AUTH_STEPS.find((step) => step.id === "ba-server");
  const routeStep = BETTER_AUTH_STEPS.find((step) => step.id === "ba-route");
  const clientStep = BETTER_AUTH_STEPS.find((step) => step.id === "ba-client");
  const mountStep = BETTER_AUTH_STEPS.find((step) => step.id === "ba-mount");
  const schemaOption = schemaStep?.options?.[variant];
  const serverOption = serverStep?.options?.[variant];

  const fileItem = (
    id: string,
    file: GuideStepFile | undefined,
    description: string,
  ): SetupTreeItem | null =>
    file
      ? {
          id,
          label: file.name.split("/").at(-1) ?? file.name,
          path: file.name.replace(/ \((Prisma|Drizzle)\)$/, ""),
          kind: "file",
          lang: file.lang,
          code: file.code,
          description,
        }
      : null;

  return [
    installStep?.command
      ? {
          id: "install",
          label: "Install packages",
          path: "terminal",
          kind: "command",
          lang: "bash",
          code: installStep.command,
          description: installStep.description,
        }
      : null,
    fileItem("env", envStep?.file, envStep?.description ?? ""),
    schemaOption?.command
      ? {
          id: `schema-${variant}`,
          label: `${variant === "prisma" ? "Prisma" : "Drizzle"} schema sync`,
          path: "terminal",
          kind: "command",
          lang: "bash",
          code: schemaOption.command,
          description: schemaOption.description ?? "Generate and sync the Better Auth schema.",
        }
      : null,
    fileItem("server-auth", serverOption?.file, serverStep?.description ?? ""),
    fileItem("api-route", routeStep?.file, routeStep?.description ?? ""),
    fileItem("auth-client", clientStep?.file, clientStep?.description ?? ""),
    fileItem("drawer-mount", mountStep?.file, mountStep?.description ?? ""),
  ].filter(Boolean) as SetupTreeItem[];
}

function formatWholeSetup(items: SetupTreeItem[]) {
  return items
    .map((item) =>
      item.kind === "command" ? `# ${item.label}\n${item.code}` : `# ${item.path}\n${item.code}`,
    )
    .join("\n\n");
}

function getSupabaseSetupTree(): SetupTreeItem[] {
  return SUPABASE_STEPS.map((step) => {
    if (step.type === "command" && step.command) {
      return {
        id: step.id,
        label: step.title,
        path: "terminal",
        kind: "command",
        lang: "bash",
        code: step.command,
        description: step.description,
      };
    }

    if (step.type === "single-file" && step.file) {
      return {
        id: step.id,
        label: step.file.name.split("/").at(-1) ?? step.file.name,
        path: step.file.name,
        kind: "file",
        lang: step.file.lang,
        code: step.file.code,
        description: step.description,
      };
    }

    return null;
  }).filter(Boolean) as SetupTreeItem[];
}

function getSetupTreeFromSteps(steps: GuideStep[]): SetupTreeItem[] {
  return steps.map((step) => {
    if (step.type === "command" && step.command) {
      return {
        id: step.id,
        label: step.title,
        path: "terminal",
        kind: "command",
        lang: "bash",
        code: step.command,
        description: step.description,
      };
    }

    if (step.type === "single-file" && step.file) {
      return {
        id: step.id,
        label: step.file.name.split("/").at(-1) ?? step.file.name,
        path: step.file.name,
        kind: "file",
        lang: step.file.lang,
        code: step.file.code,
        description: step.description,
      };
    }

    return null;
  }).filter(Boolean) as SetupTreeItem[];
}

function ProviderSetupTree({
  steps,
  folderLabel,
  description,
}: {
  steps: GuideStep[];
  folderLabel: string;
  description: string;
}) {
  const items = useMemo(() => getSetupTreeFromSteps(steps), [steps]);
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [copied, setCopied] = useState<"all" | null>(null);
  const selectedItem = items.find((item) => item.id === selectedId) ?? items[0];

  const copyWholeSetup = async () => {
    await navigator.clipboard.writeText(formatWholeSetup(items));
    setCopied("all");
    window.setTimeout(() => setCopied(null), 1600);
  };

  return (
    <div className="mt-4 overflow-hidden rounded-[8px] border border-foreground/10 bg-background">
      <div className="flex flex-col gap-3 border-b border-foreground/10 bg-foreground/[0.018] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-foreground/82">Copy-ready setup tree</p>
          <p className="mt-0.5 text-[0.68rem] leading-5 text-foreground/48">
            {description}
          </p>
        </div>
        <button
          type="button"
          onClick={copyWholeSetup}
          className="inline-flex h-8 w-fit items-center gap-1.5 rounded-[5px] border border-foreground/10 bg-background px-2.5 text-[0.66rem] font-semibold text-foreground/58 transition-colors hover:border-foreground/20 hover:text-foreground active:scale-[0.98]"
        >
          {copied === "all" ? <Check size={12} /> : <Copy size={12} />}
          {copied === "all" ? "Copied" : "Copy all"}
        </button>
      </div>

      <div className="grid min-h-[25rem] lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="border-b border-foreground/10 p-2 lg:border-b-0 lg:border-r lg:border-foreground/10">
          <div className="flex items-center gap-2 px-2 py-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-foreground/38">
            <FolderOpen size={12} />
            {folderLabel}
          </div>
          <div className="mt-1 space-y-1">
            {items.map((item) => {
              const Icon = item.kind === "command" ? Terminal : FileText;
              const isSelected = selectedItem?.id === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`flex w-full min-w-0 items-start gap-2 rounded-[5px] px-2 py-2 text-left transition-colors active:scale-[0.99] ${
                    isSelected
                      ? "bg-foreground/[0.07] text-foreground"
                      : "text-foreground/48 hover:bg-foreground/[0.035] hover:text-foreground/72"
                  }`}
                >
                  <Icon size={13} className="mt-0.5 shrink-0" />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold">{item.label}</span>
                    <span className="mt-0.5 block truncate font-mono text-[0.64rem] opacity-60">
                      {item.path}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-w-0">
          {selectedItem ? (
            <>
              <div className="flex flex-col gap-2 border-b border-foreground/10 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-mono text-[0.7rem] text-foreground/64">
                    {selectedItem.path}
                  </p>
                  <p className="mt-0.5 text-[0.68rem] leading-5 text-foreground/46">
                    {selectedItem.description}
                  </p>
                </div>
                <span className="w-fit rounded-[4px] border border-foreground/10 bg-foreground/[0.025] px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-foreground/38">
                  {selectedItem.kind === "command" ? "Run" : "Create"}
                </span>
              </div>
              <CodeBlock lang={selectedItem.lang} embedded title={selectedItem.path}>
                {selectedItem.code}
              </CodeBlock>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SupabaseSetupTree() {
  const items = useMemo(() => getSupabaseSetupTree(), []);
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [copied, setCopied] = useState<"all" | null>(null);
  const selectedItem = items.find((item) => item.id === selectedId) ?? items[0];

  const copyWholeSetup = async () => {
    await navigator.clipboard.writeText(formatWholeSetup(items));
    setCopied("all");
    window.setTimeout(() => setCopied(null), 1600);
  };

  return (
    <div className="mt-4 overflow-hidden rounded-[8px] border border-foreground/10 bg-background">
      <div className="flex flex-col gap-3 border-b border-foreground/10 bg-foreground/[0.018] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-foreground/82">Copy-ready setup tree</p>
          <p className="mt-0.5 text-[0.68rem] leading-5 text-foreground/48">
            Browse the exact commands and files a fresh Supabase install needs.
          </p>
        </div>
        <button
          type="button"
          onClick={copyWholeSetup}
          className="inline-flex h-8 w-fit items-center gap-1.5 rounded-[5px] border border-foreground/10 bg-background px-2.5 text-[0.66rem] font-semibold text-foreground/58 transition-colors hover:border-foreground/20 hover:text-foreground active:scale-[0.98]"
        >
          {copied === "all" ? <Check size={12} /> : <Copy size={12} />}
          {copied === "all" ? "Copied" : "Copy all"}
        </button>
      </div>

      <div className="grid min-h-[25rem] lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="border-b border-foreground/10 p-2 lg:border-b-0 lg:border-r lg:border-foreground/10">
          <div className="flex items-center gap-2 px-2 py-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-foreground/38">
            <FolderOpen size={12} />
            supabase
          </div>
          <div className="mt-1 space-y-1">
            {items.map((item) => {
              const Icon = item.kind === "command" ? Terminal : FileText;
              const isSelected = selectedItem?.id === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`flex w-full min-w-0 items-start gap-2 rounded-[5px] px-2 py-2 text-left transition-colors active:scale-[0.99] ${
                    isSelected
                      ? "bg-foreground/[0.07] text-foreground"
                      : "text-foreground/48 hover:bg-foreground/[0.035] hover:text-foreground/72"
                  }`}
                >
                  <Icon size={13} className="mt-0.5 shrink-0" />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold">{item.label}</span>
                    <span className="mt-0.5 block truncate font-mono text-[0.64rem] opacity-60">
                      {item.path}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-w-0">
          {selectedItem ? (
            <>
              <div className="flex flex-col gap-2 border-b border-foreground/10 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-mono text-[0.7rem] text-foreground/64">
                    {selectedItem.path}
                  </p>
                  <p className="mt-0.5 text-[0.68rem] leading-5 text-foreground/46">
                    {selectedItem.description}
                  </p>
                </div>
                <span className="w-fit rounded-[4px] border border-foreground/10 bg-foreground/[0.025] px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-foreground/38">
                  {selectedItem.kind === "command" ? "Run" : "Create"}
                </span>
              </div>
              <CodeBlock lang={selectedItem.lang} embedded title={selectedItem.path}>
                {selectedItem.code}
              </CodeBlock>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BetterAuthSetupTree() {
  const [variant, setVariant] = useState<BetterAuthSetupVariant>("prisma");
  const items = useMemo(() => getBetterAuthSetupTree(variant), [variant]);
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [copied, setCopied] = useState<"all" | null>(null);
  const selectedItem = items.find((item) => item.id === selectedId) ?? items[0];

  useEffect(() => {
    if (!items.some((item) => item.id === selectedId)) {
      setSelectedId(items[0]?.id ?? "");
    }
  }, [items, selectedId]);

  const copyWholeSetup = async () => {
    await navigator.clipboard.writeText(formatWholeSetup(items));
    setCopied("all");
    window.setTimeout(() => setCopied(null), 1600);
  };

  return (
    <div className="mt-4 overflow-hidden rounded-[8px] border border-foreground/10 bg-background">
      <div className="flex flex-col gap-3 border-b border-foreground/10 bg-foreground/[0.018] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-foreground/82">Copy-ready setup tree</p>
          <p className="mt-0.5 text-[0.68rem] leading-5 text-foreground/48">
            Browse the exact commands and files a fresh Better Auth install needs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="grid h-8 grid-cols-2 rounded-[5px] border border-foreground/10 bg-background p-0.5">
            {(["prisma", "drizzle"] as const).map((nextVariant) => (
              <button
                key={nextVariant}
                type="button"
                onClick={() => setVariant(nextVariant)}
                className={`rounded-[4px] px-2.5 text-[0.66rem] font-semibold capitalize transition-colors active:scale-[0.98] ${
                  variant === nextVariant
                    ? "bg-foreground text-background"
                    : "text-foreground/48 hover:text-foreground/72"
                }`}
              >
                {nextVariant}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={copyWholeSetup}
            className="inline-flex h-8 items-center gap-1.5 rounded-[5px] border border-foreground/10 bg-background px-2.5 text-[0.66rem] font-semibold text-foreground/58 transition-colors hover:border-foreground/20 hover:text-foreground active:scale-[0.98]"
          >
            {copied === "all" ? <Check size={12} /> : <Copy size={12} />}
            {copied === "all" ? "Copied" : "Copy all"}
          </button>
        </div>
      </div>

      <div className="grid min-h-[25rem] lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="border-b border-foreground/10 p-2 lg:border-b-0 lg:border-r lg:border-foreground/10">
          <div className="flex items-center gap-2 px-2 py-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-foreground/38">
            <FolderOpen size={12} />
            better-auth
          </div>
          <div className="mt-1 space-y-1">
            {items.map((item) => {
              const Icon = item.kind === "command" ? Terminal : FileText;
              const isSelected = selectedItem?.id === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`flex w-full min-w-0 items-start gap-2 rounded-[5px] px-2 py-2 text-left transition-colors active:scale-[0.99] ${
                    isSelected
                      ? "bg-foreground/[0.07] text-foreground"
                      : "text-foreground/48 hover:bg-foreground/[0.035] hover:text-foreground/72"
                  }`}
                >
                  <Icon size={13} className="mt-0.5 shrink-0" />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold">{item.label}</span>
                    <span className="mt-0.5 block truncate font-mono text-[0.64rem] opacity-60">
                      {item.path}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-w-0">
          {selectedItem ? (
            <>
              <div className="flex flex-col gap-2 border-b border-foreground/10 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-mono text-[0.7rem] text-foreground/64">
                    {selectedItem.path}
                  </p>
                  <p className="mt-0.5 text-[0.68rem] leading-5 text-foreground/46">
                    {selectedItem.description}
                  </p>
                </div>
                <span className="w-fit rounded-[4px] border border-foreground/10 bg-foreground/[0.025] px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-foreground/38">
                  {selectedItem.kind === "command" ? "Run" : "Create"}
                </span>
              </div>
              <CodeBlock lang={selectedItem.lang} embedded title={selectedItem.path}>
                {selectedItem.code}
              </CodeBlock>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function SupabaseGuide() {
  return (
    <div id="supabase-guide" className="scroll-mt-24 border-t border-foreground/10 bg-foreground/[0.005]">
      <div className="border-b border-foreground/10 p-5 space-y-1">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/60" />
          Complete A-Z Integration Walkthrough
        </h4>
        <p className="text-xs text-foreground/50 leading-relaxed pl-3.5">
          Below is the full setup path for wiring Supabase Auth into Auth Drawer in a Next.js app.
        </p>

        <div className="mt-4 ml-3.5 p-3 rounded-[6px] border border-foreground/10 bg-foreground/[0.015] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground/80">
              Already got Supabase Auth set up?
            </p>
            <p className="text-[0.68rem] text-foreground/50 leading-relaxed">
              If your project, env vars, redirects, and browser client are ready, jump straight to
              mounting the drawer.
            </p>
          </div>
          <a
            href="#supabase-mount"
            className="shrink-0 inline-flex h-8 items-center justify-center rounded-[4px] bg-foreground px-3 text-[0.7rem] font-semibold text-background transition-transform active:scale-[0.98]"
          >
            Skip to mounting drawer (Step 5) →
          </a>
        </div>
        <SupabaseSetupTree />
      </div>

      <div className="p-5 space-y-6 bg-foreground/[0.002]">
        {SUPABASE_STEPS.map((step) => (
          <div key={step.id} id={step.id} className="scroll-mt-24 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground/[0.08] text-[0.65rem] font-bold text-foreground/68">
                  {step.number}
                </span>
                <h5 className="text-xs font-semibold uppercase tracking-wider text-foreground/68">
                  {step.title}
                </h5>
              </div>
              {step.docsUrl && (
                <a
                  href={step.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[0.66rem] font-medium text-foreground/36 hover:text-foreground/60 transition-colors pr-1"
                >
                  <ExternalLink size={10} className="stroke-[2.5]" />
                  Supabase Docs
                </a>
              )}
            </div>
            <p className="text-xs text-foreground/60 leading-relaxed">{step.description}</p>

            {step.type === "command" && step.command && (
              <div>
                <CodeBlock lang="bash" embedded>
                  {step.command}
                </CodeBlock>
              </div>
            )}

            {step.type === "single-file" && step.file && (
              <div className="overflow-hidden rounded-[6px] border border-foreground/10 bg-background">
                <div className="bg-foreground/[0.02] px-3 py-1.5 border-b border-foreground/10 flex items-center justify-between">
                  <span className="font-mono text-[0.65rem] text-foreground/45">
                    {step.file.name}
                  </span>
                </div>
                <CodeBlock lang={step.file.lang} embedded>
                  {step.file.code}
                </CodeBlock>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProviderGuide({
  id,
  steps,
  title,
  intro,
  readyTitle,
  readyCopy,
  skipHref,
  skipLabel,
  folderLabel,
  treeDescription,
  docsLabel,
}: {
  id: string;
  steps: GuideStep[];
  title: string;
  intro: string;
  readyTitle: string;
  readyCopy: string;
  skipHref: string;
  skipLabel: string;
  folderLabel: string;
  treeDescription: string;
  docsLabel: string;
}) {
  return (
    <div id={id} className="scroll-mt-24 border-t border-foreground/10 bg-foreground/[0.005]">
      <div className="border-b border-foreground/10 p-5 space-y-1">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/60" />
          {title}
        </h4>
        <p className="text-xs text-foreground/50 leading-relaxed pl-3.5">{intro}</p>

        <div className="mt-4 ml-3.5 p-3 rounded-[6px] border border-foreground/10 bg-foreground/[0.015] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground/80">{readyTitle}</p>
            <p className="text-[0.68rem] text-foreground/50 leading-relaxed">{readyCopy}</p>
          </div>
          <a
            href={skipHref}
            className="shrink-0 inline-flex h-8 items-center justify-center rounded-[4px] bg-foreground px-3 text-[0.7rem] font-semibold text-background transition-transform active:scale-[0.98]"
          >
            {skipLabel}
          </a>
        </div>
        <ProviderSetupTree
          steps={steps}
          folderLabel={folderLabel}
          description={treeDescription}
        />
      </div>

      <div className="p-5 space-y-6 bg-foreground/[0.002]">
        {steps.map((step) => (
          <div key={step.id} id={step.id} className="scroll-mt-24 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground/[0.08] text-[0.65rem] font-bold text-foreground/68">
                  {step.number}
                </span>
                <h5 className="text-xs font-semibold uppercase tracking-wider text-foreground/68">
                  {step.title}
                </h5>
              </div>
              {step.docsUrl && (
                <a
                  href={step.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[0.66rem] font-medium text-foreground/36 hover:text-foreground/60 transition-colors pr-1"
                >
                  <ExternalLink size={10} className="stroke-[2.5]" />
                  {docsLabel}
                </a>
              )}
            </div>
            <p className="text-xs text-foreground/60 leading-relaxed">{step.description}</p>

            {step.type === "command" && step.command && (
              <div>
                <CodeBlock lang="bash" embedded>
                  {step.command}
                </CodeBlock>
              </div>
            )}

            {step.type === "single-file" && step.file && (
              <div className="overflow-hidden rounded-[6px] border border-foreground/10 bg-background">
                <div className="bg-foreground/[0.02] px-3 py-1.5 border-b border-foreground/10 flex items-center justify-between">
                  <span className="font-mono text-[0.65rem] text-foreground/45">
                    {step.file.name}
                  </span>
                </div>
                <CodeBlock lang={step.file.lang} embedded>
                  {step.file.code}
                </CodeBlock>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function NextAuthGuide() {
  return (
    <ProviderGuide
      id="next-auth-guide"
      steps={NEXT_AUTH_STEPS}
      title="Complete A-Z Integration Walkthrough"
      intro="Below is the full setup path for wiring Auth.js / NextAuth into Auth Drawer in a Next.js App Router app."
      readyTitle="Already got Auth.js set up?"
      readyCopy="If your auth config, route handler, and SessionProvider are ready, jump straight to mounting the drawer."
      skipHref="#next-auth-mount"
      skipLabel="Skip to mounting drawer (Step 6) →"
      folderLabel="next-auth"
      treeDescription="Browse the exact commands and files a fresh Auth.js install needs."
      docsLabel="Auth.js Docs"
    />
  );
}

export function ClerkGuide() {
  return (
    <ProviderGuide
      id="clerk-guide"
      steps={CLERK_STEPS}
      title="Complete A-Z Integration Walkthrough"
      intro="Below is the full setup path for wiring Clerk into Auth Drawer in a Next.js app."
      readyTitle="Already got Clerk Auth set up?"
      readyCopy="If your app has Clerk middleware, ClerkProvider, and dashboard methods ready, jump straight to mounting the drawer."
      skipHref="#clerk-mount"
      skipLabel="Skip to mounting drawer (Step 6) →"
      folderLabel="clerk"
      treeDescription="Browse the exact commands and files a fresh Clerk install needs."
      docsLabel="Clerk Docs"
    />
  );
}

export function BetterAuthGuide() {
  return (
    <div id="ba-guide" className="scroll-mt-24 border-t border-foreground/10 bg-foreground/[0.005]">
      <div className="border-b border-foreground/10 p-5 space-y-1">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/60" />
          Complete A-Z Integration Walkthrough
        </h4>
        <p className="text-xs text-foreground/50 leading-relaxed pl-3.5">
          Below is the comprehensive setup path to integrate Better Auth on both the server and
          client in a Next.js environment, fully wired to the Auth Drawer.
        </p>

        {/* Skip banner */}
        <div className="mt-4 ml-3.5 p-3 rounded-[6px] border border-foreground/10 bg-foreground/[0.015] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground/80">
              Already got Better Auth set up in your project?
            </p>
            <p className="text-[0.68rem] text-foreground/50 leading-relaxed">
              If your database, server configs, and client SDK are ready, you can jump straight to
              mounting the drawer component.
            </p>
          </div>
          <a
            href="#ba-mount"
            className="shrink-0 inline-flex h-8 items-center justify-center rounded-[4px] bg-foreground px-3 text-[0.7rem] font-semibold text-background transition-transform active:scale-[0.98]"
          >
            Skip to mounting drawer (Step 7) →
          </a>
        </div>
        <BetterAuthSetupTree />
      </div>

      <div className="p-5 space-y-6 bg-foreground/[0.002]">
        {BETTER_AUTH_STEPS.map((step) => (
          <div key={step.id} id={step.id} className="scroll-mt-24 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground/[0.08] text-[0.65rem] font-bold text-foreground/68">
                  {step.number}
                </span>
                <h5 className="text-xs font-semibold uppercase tracking-wider text-foreground/68">
                  {step.title}
                </h5>
              </div>
              {step.docsUrl && (
                <a
                  href={step.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[0.66rem] font-medium text-foreground/36 hover:text-foreground/60 transition-colors pr-1"
                >
                  <ExternalLink size={10} className="stroke-[2.5]" />
                  Better Auth Docs
                </a>
              )}
            </div>
            <p className="text-xs text-foreground/60 leading-relaxed">{step.description}</p>

            {step.type === "command" && step.command && (
              <div>
                <CodeBlock lang="bash" embedded>
                  {step.command}
                </CodeBlock>
              </div>
            )}

            {step.type === "single-file" && step.file && (
              <div className="overflow-hidden rounded-[6px] border border-foreground/10 bg-background">
                <div className="bg-foreground/[0.02] px-3 py-1.5 border-b border-foreground/10 flex items-center justify-between">
                  <span className="font-mono text-[0.65rem] text-foreground/45">
                    {step.file.name}
                  </span>
                </div>
                <CodeBlock lang={step.file.lang} embedded>
                  {step.file.code}
                </CodeBlock>
              </div>
            )}

            {step.type === "split-adapters" && step.options && (
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Prisma Option */}
                <div className="overflow-hidden rounded-[6px] border border-foreground/10 bg-background flex flex-col justify-between p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[0.68rem] font-bold tracking-wider uppercase text-foreground/60 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500/80" />
                      {step.options.prisma.name}
                    </p>
                    {step.options.prisma.docsUrl && (
                      <a
                        href={step.options.prisma.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[0.62rem] font-medium text-foreground/30 hover:text-foreground/50 transition-colors"
                      >
                        <ExternalLink size={9} />
                        Prisma Docs
                      </a>
                    )}
                  </div>
                  {step.options.prisma.description && (
                    <p className="text-[0.72rem] text-foreground/50 leading-relaxed">
                      {step.options.prisma.description}
                    </p>
                  )}
                  {step.options.prisma.command && (
                    <CodeBlock lang="bash" embedded>
                      {step.options.prisma.command}
                    </CodeBlock>
                  )}
                  {step.options.prisma.file && (
                    <div className="overflow-hidden rounded-[6px] border border-foreground/10 bg-background flex flex-col justify-between">
                      <div className="bg-foreground/[0.02] px-3 py-1.5 border-b border-foreground/10 flex items-center justify-between">
                        <span className="font-mono text-[0.65rem] text-foreground/45">
                          {step.options.prisma.file.name}
                        </span>
                      </div>
                      <CodeBlock lang={step.options.prisma.file.lang} embedded>
                        {step.options.prisma.file.code}
                      </CodeBlock>
                    </div>
                  )}
                </div>

                {/* Drizzle Option */}
                <div className="overflow-hidden rounded-[6px] border border-foreground/10 bg-background flex flex-col justify-between p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[0.68rem] font-bold tracking-wider uppercase text-foreground/60 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500/80" />
                      {step.options.drizzle.name}
                    </p>
                    {step.options.drizzle.docsUrl && (
                      <a
                        href={step.options.drizzle.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[0.62rem] font-medium text-foreground/30 hover:text-foreground/50 transition-colors"
                      >
                        <ExternalLink size={9} />
                        Drizzle Docs
                      </a>
                    )}
                  </div>
                  {step.options.drizzle.description && (
                    <p className="text-[0.72rem] text-foreground/50 leading-relaxed">
                      {step.options.drizzle.description}
                    </p>
                  )}
                  {step.options.drizzle.command && (
                    <CodeBlock lang="bash" embedded>
                      {step.options.drizzle.command}
                    </CodeBlock>
                  )}
                  {step.options.drizzle.file && (
                    <div className="overflow-hidden rounded-[6px] border border-foreground/10 bg-background flex flex-col justify-between">
                      <div className="bg-foreground/[0.02] px-3 py-1.5 border-b border-foreground/10 flex items-center justify-between">
                        <span className="font-mono text-[0.65rem] text-foreground/45">
                          {step.options.drizzle.file.name}
                        </span>
                      </div>
                      <CodeBlock lang={step.options.drizzle.file.lang} embedded>
                        {step.options.drizzle.file.code}
                      </CodeBlock>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FeaturePill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-[999px] border border-foreground/10 bg-background px-2 py-1 text-[0.66rem] font-medium text-foreground/58">
      {children}
    </span>
  );
}

const ADAPTER_FACTORY_NAMES: Record<string, string> = {
  supabase: "createSupabaseAdapter",
  "better-auth": "createBetterAuthAdapter",
  "next-auth": "createNextAuthAdapter",
  clerk: "createClerkAdapter",
  firebase: "createFirebaseAdapter",
  "custom-jwt": "createCustomJwtAdapter",
  passport: "createPassportAdapter",
  mock: "createMockAdapter",
};

function getAdapterFactoryName(docId: string) {
  return ADAPTER_FACTORY_NAMES[docId] ?? "createAuthAdapter";
}

function ProviderMetaCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-foreground/10 bg-background shadow-[0_1px_0_rgba(255,255,255,0.02)]">
      <div className="border-b border-foreground/10 bg-foreground/[0.02] px-3 py-2">
        <p className="text-[0.63rem] font-semibold uppercase tracking-[0.16em] text-foreground/42">
          {label}
        </p>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

export function SdkDocsSection() {
  const providerStorageKey = "auth-drawer-docs-sdk-state";
  const [showAllProviders, setShowAllProviders] = useState(false);
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({});

  const previewDocs = useMemo(() => SDK_DOCS.slice(0, 2), []);

  const visibleDocs = showAllProviders ? SDK_DOCS : previewDocs;

  const toggleProvider = (id: string) => {
    setExpandedProviders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(providerStorageKey);
      if (!stored) return;
      const parsed = JSON.parse(stored) as {
        showAllProviders?: boolean;
        expandedProviders?: Record<string, boolean>;
      };
      if (typeof parsed.showAllProviders === "boolean") {
        setShowAllProviders(parsed.showAllProviders);
      }
      if (parsed.expandedProviders) {
        setExpandedProviders(parsed.expandedProviders);
      }
    } catch {
      // Ignore malformed stored state.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        providerStorageKey,
        JSON.stringify({ showAllProviders, expandedProviders }),
      );
    } catch {
      // Ignore storage quota or privacy errors.
    }
  }, [expandedProviders, showAllProviders]);

  return (
    <div className="space-y-8">
      <div>
        <p className="max-w-2xl text-sm leading-6 text-foreground/58">
          The drawer never talks to a backend by itself. You pass one typed adapter, and the adapter
          decides which UI is available. If <code className="font-mono text-[0.72rem]">signUp</code>{" "}
          is missing, register mode is hidden. If{" "}
          <code className="font-mono text-[0.72rem]">signInWithOAuth</code> is missing, OAuth
          buttons are hidden. If{" "}
          <code className="font-mono text-[0.72rem]">requestPasswordReset</code> is missing,
          forgot-password is hidden.
        </p>
        <div className="mt-4 rounded-[8px] border border-foreground/10 bg-foreground/[0.03] overflow-hidden">
          <div className="bg-foreground/[0.02] px-4 py-2.5 border-b border-foreground/10 flex items-center justify-between">
            <span className="font-mono text-[0.68rem] text-foreground/45">
              packages/auth-drawer/src/types.ts
            </span>
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-foreground/40">
              Required adapter contract
            </span>
          </div>
          <CodeBlock lang="ts" embedded title="types.ts">
            {ADAPTER_CONTRACT}
          </CodeBlock>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {visibleDocs.map((doc) => (
          <a
            key={doc.id}
            href={`#sdk-${doc.id}`}
            className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-3 transition-colors hover:border-foreground/20 hover:bg-foreground/[0.045]"
          >
            <p className="text-sm font-semibold text-foreground">{doc.name}</p>
            <p className="mt-1 font-mono text-[0.68rem] text-foreground/42">{doc.importPath}</p>
          </a>
        ))}
      </div>

      {SDK_DOCS.length > previewDocs.length ? (
        <div>
          <button
            type="button"
            onClick={() => setShowAllProviders((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-[5px] border border-foreground/10 bg-background px-3 py-2 text-xs font-semibold text-foreground/64 transition-colors hover:border-foreground/20 hover:text-foreground"
          >
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${showAllProviders ? "rotate-180" : ""}`}
            />
            {showAllProviders ? "Show fewer providers" : "Show all providers"}
          </button>
        </div>
      ) : null}

      <div className="space-y-6">
        {SDK_DOCS.map((doc) => (
          <article
            key={doc.id}
            id={`sdk-${doc.id}`}
            className="scroll-mt-24 overflow-hidden rounded-[10px] border border-foreground/10 bg-foreground/[0.02]"
          >
            <div className="border-b border-foreground/10 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">{doc.name}</h3>
                </div>
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/58">{doc.notes}</p>
            </div>
            <div className="grid gap-3 border-b border-foreground/10 p-4 md:grid-cols-3">
              <ProviderMetaCard label="Install">
                <CodeBlock lang="bash" embedded>
                  {doc.install}
                </CodeBlock>
              </ProviderMetaCard>
              <ProviderMetaCard label="Import">
                <CodeBlock lang="ts" embedded>
                  {`import { ${getAdapterFactoryName(doc.id)} } from "${doc.importPath}";`}
                </CodeBlock>
              </ProviderMetaCard>
              <ProviderMetaCard label="Features">
                <div className="flex flex-wrap gap-1.5">
                  {doc.supports.map((feature) => (
                    <span
                      key={`${doc.id}-${feature}`}
                      className="rounded-[999px] border border-foreground/10 bg-foreground/[0.03] px-2 py-1 text-[0.66rem] font-medium text-foreground/62"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </ProviderMetaCard>
            </div>
            <div className="grid gap-4 border-b border-foreground/10 p-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/42">
                    Client shape
                  </p>
                  <CodeBlock lang="ts" embedded title="client shape">
                    {doc.clientShape}
                  </CodeBlock>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/42">
                      Setup steps
                    </p>
                    {doc.setup.length > 2 ? (
                      <button
                        type="button"
                        onClick={() => toggleProvider(doc.id)}
                        className="text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-foreground/42 transition-colors hover:text-foreground/70"
                      >
                        {expandedProviders[doc.id] ? "Show less" : "Show all"}
                      </button>
                    ) : null}
                  </div>
                  <ol className="space-y-2 text-sm leading-6 text-foreground/60">
                    {(expandedProviders[doc.id] ? doc.setup : doc.setup.slice(0, 2)).map(
                      (item, index) => (
                        <li key={`${doc.id}-setup-${index}`} className="flex gap-2">
                          <span className="font-mono text-[0.68rem] text-foreground/38">
                            {index + 1}.
                          </span>
                          <span>{item}</span>
                        </li>
                      ),
                    )}
                  </ol>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/42">
                    Notes
                  </p>
                  <div className="rounded-[8px] border border-foreground/10 bg-background p-3 text-sm leading-6 text-foreground/60">
                    {doc.notes}
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/42">
                      Gotchas
                    </p>
                    {doc.gotchas.length > 2 ? (
                      <button
                        type="button"
                        onClick={() => toggleProvider(doc.id)}
                        className="text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-foreground/42 transition-colors hover:text-foreground/70"
                      >
                        {expandedProviders[doc.id] ? "Show less" : "Show all"}
                      </button>
                    ) : null}
                  </div>
                  <ul className="space-y-2 text-sm leading-6 text-foreground/60">
                    {(expandedProviders[doc.id] ? doc.gotchas : doc.gotchas.slice(0, 2)).map(
                      (item, index) => (
                        <li key={`${doc.id}-gotcha-${index}`} className="flex gap-2">
                          <span className="mt-[0.55rem] h-1.5 w-1.5 rounded-full bg-foreground/35" />
                          <span>{item}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            </div>
            {doc.id === "supabase" && <SupabaseGuide />}
            {doc.id === "better-auth" && <BetterAuthGuide />}
            {doc.id === "next-auth" && <NextAuthGuide />}
            {doc.id === "clerk" && <ClerkGuide />}
            <CodeBlock lang="tsx" embedded title={SNIPPET_FILENAMES[doc.id] || "login.tsx"}>
              {doc.snippet}
            </CodeBlock>
          </article>
        ))}
      </div>
    </div>
  );
}
