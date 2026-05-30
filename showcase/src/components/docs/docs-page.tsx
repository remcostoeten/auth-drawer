"use client";

import Link from "next/link";
import { Menu, Play, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CodeBlock } from "../code/server-code-block";
import {
  TabbedCodeBlock,
  createPackageInstallVariants,
} from "../code/tabbed-code-block";
import {
  AuthDrawer,
  DEFAULT_CONFIG,
  type AuthAdapter,
  type AuthConfig,
  type AuthConfigGroup,
} from "@/components/auth/auth-drawer";
import { createMockAdapter } from "@remcostoeten/auth-drawer/adapters/mock";
import { Configurator } from "./configurator/configurator";
import { OAUTH_OVERFLOW_PROVIDERS } from "./configurator/constants";
import {
  buildConfig,
  DEFAULT_USAGE_CODE,
  initBackdrop,
  initCopy,
  initMotion,
} from "./configurator/helpers";
import { DocsSidebarBrand, DocsSidebarNav } from "./docs-sidebar-nav";
import { PackageMetaLinks } from "@/components/package-meta-links";
import { OAuthDocsSection } from "./oauth-docs-section";
import { SdkDocsSection } from "./sdk-docs-section";
import { TriggersDocsSection } from "./triggers-docs-section";
import {
  AUTH_CONFIG_GROUP_PROPS,
  OAUTH_AUTH_PROPS,
  OAUTH_COPY_PROPS,
} from "./props/auth-config-props";
import { AUTH_DRAWER_PROPS, CONFIG_PROPS } from "./props/auth-drawer-props";
import { COPY_CONFIG_PROPS } from "./props/copy-props";
import {
  MOTION_BACKDROP_PROPS,
  MOTION_DRAG_PROPS,
  MOTION_ENTRY_EXIT_PROPS,
  MOTION_LAYOUT_PROPS,
  VISUAL_PROPS,
} from "./props/visual-props";
import {
  CLICK_TRIGGER_PROPS,
  CUSTOM_TRIGGER_PROPS,
  IDLE_TRIGGER_PROPS,
  PAGE_LOAD_TRIGGER_PROPS,
  SCROLL_HOOK_PROPS,
  SCROLL_OPEN_TRIGGER_PROPS,
  STATE_TRIGGER_PROPS,
  TRIGGER_EVENT_PROPS,
  TRIGGER_POLICY_PROPS,
  TRIGGER_STORE_PROPS,
} from "./props/trigger-props";
import { PropTable, Section } from "./ui/section";

const MINIMAL_USAGE_CODE = `import { createAuthClient } from "better-auth/react";
import { AuthDrawer } from "@remcostoeten/auth-drawer";
import { createBetterAuthAdapter } from "@remcostoeten/auth-drawer/adapters/better-auth";

// Created from your Better Auth config, usually exported from "@/lib/auth-client".
const client = createAuthClient();
const adapter = createBetterAuthAdapter({ client });

<AuthDrawer adapter={adapter} />`;

export function DocsPage() {
  const [isOpen, setOpen] = useState(false);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [drawerAuthOverride, setDrawerAuthOverride] =
    useState<Partial<AuthConfigGroup> | null>(null);
  const [isConfigInView, setConfigInView] = useState(false);
  const mobileTocCloseRef = useRef<HTMLButtonElement>(null);
  const mobileTocTriggerRef = useRef<HTMLButtonElement>(null);
  const [config, setConfig] = useState<AuthConfig>(() =>
    buildConfig({
      mode: "drawer",
      auth: {
        ...DEFAULT_CONFIG.ui.auth,
        oauthOverflow: { ...DEFAULT_CONFIG.ui.auth.oauthOverflow },
      },
      copy: initCopy(),
      backdrop: initBackdrop(),
      motion: initMotion(),
    }),
  );
  const adapter = useMemo(() => createMockAdapter() as AuthAdapter, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code !== "ShiftLeft" || event.repeat) return;
      if (!isConfigInView) return;
      event.preventDefault();
      setOpen((prev) => !prev);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConfigInView]);

  const openDrawerPreview = useCallback(
    (authOverride: Partial<AuthConfigGroup> | null) => {
      setDrawerAuthOverride(authOverride);
      setOpen(true);
    },
    [],
  );

  const handleConfigChange = useCallback((next: AuthConfig) => {
    setConfig(next);
  }, []);

  const handleInViewChange = useCallback((inView: boolean) => {
    setConfigInView(inView);
  }, []);

  useEffect(() => {
    if (!mobileTocOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousActive = document.activeElement as HTMLElement | null;

    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => mobileTocCloseRef.current?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileTocOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActive?.focus?.();
    };
  }, [mobileTocOpen]);

  return (
    <div className="docs-root relative z-10 min-h-screen bg-background text-foreground">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-[14rem_minmax(0,1fr)] lg:px-8">
        <aside className="max-md:hidden">
          <div className="custom-scrollbar sticky top-16 z-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 pb-8">
            <DocsSidebarBrand />
            <PackageMetaLinks variant="sidebar" />
            <DocsSidebarNav />
          </div>
        </aside>

        <main className="min-w-0">
          <div className="mb-4 flex justify-start md:hidden">
            <button
              ref={mobileTocTriggerRef}
              type="button"
              onClick={() => setMobileTocOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={mobileTocOpen}
              aria-controls="mobile-docs-toc"
              className="inline-flex h-10 items-center gap-2 border border-foreground/10 bg-background px-3 text-xs font-semibold text-foreground/70 transition-colors hover:border-foreground/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
            >
              <Menu size={14} aria-hidden="true" />
              Contents
            </button>
          </div>

          {mobileTocOpen ? (
            <div
              id="mobile-docs-toc"
              className="fixed inset-0 z-[260] md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Table of contents"
            >
              <button
                type="button"
                aria-label="Close table of contents"
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={() => setMobileTocOpen(false)}
              />
              <div className="absolute inset-y-0 left-0 z-[270] w-[min(88vw,22rem)] border-r border-foreground/10 bg-background shadow-[24px_0_80px_rgba(0,0,0,0.28)]">
                <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
                  <div>
                    <p className="docs-eyebrow text-[0.65rem] uppercase tracking-[0.16em] text-foreground/38">
                      Docs
                    </p>
                    <p className="text-sm text-foreground">Table of contents</p>
                  </div>
                  <button
                    ref={mobileTocCloseRef}
                    type="button"
                    onClick={() => setMobileTocOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center border border-foreground/10 text-foreground/70 transition-colors hover:border-foreground/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
                    aria-label="Close table of contents"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
                <div className="custom-scrollbar h-[calc(100%-3.5rem)] overflow-y-auto px-4 py-4">
                  <DocsSidebarBrand />
                  <PackageMetaLinks variant="sidebar" />
                  <DocsSidebarNav onNavigate={() => setMobileTocOpen(false)} />
                </div>
              </div>
            </div>
          ) : null}

          <Section id="start" title="Start" eyebrow="Introduction">
            <p className="mb-4 max-w-2xl text-sm leading-6 text-foreground/58">
              <Link
                href="https://remcostoeten.nl"
                target="_blank"
                rel="noreferrer"
                className="italic"
              >
                I've
              </Link>
              {" "}
              rebuilt the same authentication UI enough times to package it:
              an accessible, provider-agnostic auth drawer that can run as a
              mobile bottom sheet or desktop modal. Plug in a typed{" "}
              <code className="font-mono text-[0.72rem]">AuthAdapter</code> for
              your auth provider, then control OAuth, email/password,
              registration, motion, layout, and copy from one config object.
            </p>
            <p className="mb-6 max-w-2xl text-sm leading-6 text-foreground/58">
              When an adapter is present, the drawer auto-hides unsupported UI
              and shows a registration name field only for adapters that request
              one. The same adapter can power a global{" "}
              <code className="font-mono text-[0.72rem]">AuthProvider</code> and{" "}
              <code className="font-mono text-[0.72rem]">useAuth</code> hook for
              app-wide session state.
            </p>
            <p className="mb-4 max-w-2xl text-sm leading-6 text-foreground/58">
              Besides these API docs, we also provide full setup guides for{" "}
              <a
                href="#sdk-better-auth"
                className="text-foreground/72 underline underline-offset-4 transition-colors hover:text-foreground"
              >
                Better Auth
              </a>
              ,{" "}
              <a
                href="#sdk-supabase"
                className="text-foreground/72 underline underline-offset-4 transition-colors hover:text-foreground"
              >
                Supabase
              </a>
              ,{" "}
              <a
                href="#next-auth-guide"
                className="text-foreground/72 underline underline-offset-4 transition-colors hover:text-foreground"
              >
                NextAuth
              </a>
              , and{" "}
              <a
                href="#clerk-guide"
                className="text-foreground/72 underline underline-offset-4 transition-colors hover:text-foreground"
              >
                Clerk
              </a>
              .
            </p>
            <div className="mb-4 max-w-2xl">
              <CodeBlock title="minimal.tsx">{MINIMAL_USAGE_CODE}</CodeBlock>
            </div>
            <p className="mb-4 max-w-2xl text-sm leading-6 text-foreground/58">
              This will result in the <em>Open default drawer</em> button below.
              Read the full Better Auth setup{" "}
              <a
                href="#sdk-better-auth"
                className="text-foreground/72 underline underline-offset-4 transition-colors hover:text-foreground"
              >
                here
              </a>
              .
            </p>
            <div className="mb-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openDrawerPreview(null)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[5px] bg-foreground px-4 text-sm font-semibold text-background transition-transform active:scale-[0.98]"
              >
                <Play size={14} aria-hidden="true" />
                Open default drawer
              </button>
              <a
                href="#configurator"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[5px] border border-foreground/10 bg-background px-4 text-sm font-semibold text-foreground/68 transition-colors hover:border-foreground/22 hover:text-foreground"
              >
                <SlidersHorizontal size={14} aria-hidden="true" />
                Customize
              </a>
            </div>
          </Section>

          <Section id="installation" title="Install" eyebrow="Setup">
            <p className="mb-4 max-w-2xl text-sm leading-6 text-foreground/58">
              Install and render styles ship with the component import. No
              Tailwind setup, no separate CSS file.
            </p>
            <div className="space-y-4">
              <div>
                <TabbedCodeBlock
                  title="install"
                  variants={createPackageInstallVariants(
                    "@remcostoeten/auth-drawer",
                  )}
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-foreground/72">
                  2. Render
                </p>
                <CodeBlock title="usage.tsx">{DEFAULT_USAGE_CODE}</CodeBlock>
              </div>
            </div>
          </Section>

          <Section id="showcase" title="Defaults" eyebrow="Out of the box">
            <p className="max-w-2xl text-sm leading-6 text-foreground/58">
              <code className="font-mono text-[0.72rem]">DEFAULT_CONFIG</code>{" "}
              ships with GitHub and Google OAuth, login and register tabs,
              remember-me, forgot-password, backdrop, drag behaviour, and
              trigger hooks. The same config shape covers drawer vs modal
              presentation, desktop width, position, and scroll or idle open
              triggers — customize only what you need in the{" "}
              <a
                href="#configurator"
                className="text-foreground/72 underline underline-offset-4 transition-colors hover:text-foreground"
              >
                configurator
              </a>
              . For provider lists, overflow, and copy, see{" "}
              <a
                href="#oauth"
                className="text-foreground/72 underline underline-offset-4 transition-colors hover:text-foreground"
              >
                OAuth
              </a>
              .
            </p>
          </Section>

          <Section
            id="sdk-adapters"
            title="SDK adapters"
            eyebrow="Provider setup"
          >
            <SdkDocsSection />
          </Section>

          <Section id="oauth" title="OAuth" eyebrow="Social sign-in">
            <OAuthDocsSection
              onPreviewDefault={() => openDrawerPreview(null)}
              onPreviewOverflow={() =>
                openDrawerPreview({ providers: OAUTH_OVERFLOW_PROVIDERS })
              }
            />
          </Section>

          <Section id="triggers" title="Triggers" eyebrow="Activation rules">
            <TriggersDocsSection />
          </Section>

          <Section
            id="configurator"
            title="Configurator"
            eyebrow="Opt-in controls"
          >
            <Configurator
              onPreview={openDrawerPreview}
              onConfigChange={handleConfigChange}
              onInViewChange={handleInViewChange}
              authOverride={drawerAuthOverride}
            />
          </Section>

          <Section id="api" title="API reference" eyebrow="Props">
            <div className="space-y-10">
              <div>
                <h3 className="mb-1 text-sm">AuthDrawer props</h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Top-level component props. The auth adapter is required; UI
                  config and control props are optional.
                </p>
                <PropTable props={AUTH_DRAWER_PROPS} />
              </div>

              <div>
                <h3 className="mb-1 text-sm">AuthProvider</h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Global auth context wrapper around an adapter and drawer open
                  state.
                </p>
                <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.03] p-4 text-xs leading-6 text-foreground/58">
                  <p className="mb-2">
                    Use{" "}
                    <code className="font-mono text-[0.72rem]">
                      AuthProvider
                    </code>{" "}
                    when other parts of the app need the current user, session,
                    or drawer controls through{" "}
                    <code className="font-mono text-[0.72rem]">useAuth</code>.
                    When <code className="font-mono text-[0.72rem]">AuthDrawer</code>{" "}
                    is rendered inside the provider without{" "}
                    <code className="font-mono text-[0.72rem]">open</code>/
                    <code className="font-mono text-[0.72rem]">onOpenChange</code>,
                    it follows those provider controls.
                  </p>
                  <p className="mb-2">
                    Add{" "}
                    <code className="font-mono text-[0.72rem]">
                      &lt;div id=&quot;auth-drawer-portal&quot; /&gt;
                    </code>{" "}
                    in your root layout so the drawer portals above page content.
                    Without it, the drawer still works but renders inline.
                  </p>
                  <pre className="overflow-x-auto rounded-[6px] bg-background p-3 text-[0.7rem] text-foreground/72">
                    {`import { AuthDrawer, AuthProvider } from "@remcostoeten/auth-drawer";

function Shell({ adapter, children }) {
  return (
    <>
      <AuthProvider adapter={adapter}>
        {children}
        <AuthDrawer adapter={adapter} hideTrigger />
      </AuthProvider>
      <div id="auth-drawer-portal" />
    </>
  );
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="mb-1 text-sm">AuthConfig shape</h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Passed to{" "}
                  <code className="font-mono text-[0.72rem]">config</code>.
                  Groups UI controls, activation triggers, and error
                  normalization.
                </p>
                <PropTable props={CONFIG_PROPS} />
              </div>

              <div id="api-triggers" className="scroll-mt-24">
                <h3 className="mb-1 text-sm">
                  config.triggers — AuthTriggerConfig
                </h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Rules that open the auth surface. Examples live in the{" "}
                  <a
                    href="#triggers"
                    className="text-foreground/72 underline underline-offset-4 transition-colors hover:text-foreground"
                  >
                    Triggers
                  </a>{" "}
                  section.
                </p>

                <h4 className="mb-2 text-xs font-semibold text-foreground/72">
                  Shared policy
                </h4>
                <p className="mb-3 text-xs text-foreground/50">
                  All trigger kinds extend{" "}
                  <code className="font-mono text-[0.72rem]">
                    TriggerPolicy
                  </code>
                  . Fields below apply to every kind unless noted.
                </p>
                <PropTable props={TRIGGER_POLICY_PROPS} />

                <h4 className="mb-2 mt-6 text-xs font-semibold text-foreground/72">
                  pageLoad
                </h4>
                <PropTable props={PAGE_LOAD_TRIGGER_PROPS} />

                <h4 className="mb-2 mt-6 text-xs font-semibold text-foreground/72">
                  click
                </h4>
                <PropTable props={CLICK_TRIGGER_PROPS} />

                <h4 className="mb-2 mt-6 text-xs font-semibold text-foreground/72">
                  scrollOpen
                </h4>
                <PropTable props={SCROLL_OPEN_TRIGGER_PROPS} />

                <h4 className="mb-2 mt-6 text-xs font-semibold text-foreground/72">
                  state
                </h4>
                <PropTable props={STATE_TRIGGER_PROPS} />

                <h4 className="mb-2 mt-6 text-xs font-semibold text-foreground/72">
                  idle
                </h4>
                <PropTable props={IDLE_TRIGGER_PROPS} />

                <h4 className="mb-2 mt-6 text-xs font-semibold text-foreground/72">
                  custom
                </h4>
                <PropTable props={CUSTOM_TRIGGER_PROPS} />

                <h4 className="mb-2 mt-6 text-xs font-semibold text-foreground/72">
                  AuthTriggerStore
                </h4>
                <PropTable props={TRIGGER_STORE_PROPS} />

                <h4 className="mb-2 mt-6 text-xs font-semibold text-foreground/72">
                  AuthTriggerEvent
                </h4>
                <PropTable props={TRIGGER_EVENT_PROPS} />

                <h4 className="mb-2 mt-6 text-xs font-semibold text-foreground/72">
                  useScrollOpenTrigger
                </h4>
                <PropTable props={SCROLL_HOOK_PROPS} />
              </div>

              <div id="api-auth" className="scroll-mt-24">
                <h3 className="mb-1 text-sm">ui.auth — AuthConfigGroup</h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Form surface flags and initial UI state. OAuth-specific fields
                  are documented in{" "}
                  <a
                    href="#api-oauth"
                    className="text-foreground/72 underline underline-offset-4 transition-colors hover:text-foreground"
                  >
                    OAuth API
                  </a>
                  .
                </p>
                <PropTable props={AUTH_CONFIG_GROUP_PROPS} />
              </div>

              <div id="api-oauth" className="scroll-mt-24">
                <h3 className="mb-1 text-sm">OAuth</h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Provider list, layout, overflow disclosure, and OAuth copy.
                  Examples live in the{" "}
                  <a
                    href="#oauth"
                    className="text-foreground/72 underline underline-offset-4 transition-colors hover:text-foreground"
                  >
                    OAuth
                  </a>{" "}
                  section.
                </p>
                <h4 className="mb-2 text-xs font-semibold text-foreground/72">
                  ui.auth
                </h4>
                <PropTable props={OAUTH_AUTH_PROPS} />
                <h4 className="mb-2 mt-6 text-xs font-semibold text-foreground/72">
                  ui.copy.oauth
                </h4>
                <PropTable props={OAUTH_COPY_PROPS} />
              </div>

              <div id="api-copy" className="scroll-mt-24">
                <h3 className="mb-1 text-sm">ui.copy — AuthCopyConfig</h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Controls every user-facing string in the drawer: headings,
                  field labels, button text, OAuth labels, validation messages,
                  and normalized error copy.
                </p>
                <PropTable props={COPY_CONFIG_PROPS} />
              </div>

              <div id="api-visual" className="scroll-mt-24">
                <h3 className="mb-1 text-sm">ui.visual — backdrop</h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Static visual properties for the backdrop overlay. For
                  animated backdrop values that move with the open/close
                  transition, see{" "}
                  <code className="font-mono text-[0.72rem]">ui.motion</code>.
                  Override the packaged overlay theme with{" "}
                  <code className="font-mono text-[0.72rem]">--surface-overlay</code>,{" "}
                  <code className="font-mono text-[0.72rem]">--text-on-overlay</code>,
                  and{" "}
                  <code className="font-mono text-[0.72rem]">--border-overlay</code>.
                </p>
                <PropTable props={VISUAL_PROPS} />
              </div>

              <div id="api-motion" className="scroll-mt-24">
                <h3 className="mb-1 text-sm">
                  ui.motion — layout &amp; display
                </h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Controls how the surface is sized, positioned, and laid out on
                  desktop viewports.
                </p>
                <PropTable props={MOTION_LAYOUT_PROPS} />
              </div>

              <div>
                <h3 className="mb-1 text-sm">
                  ui.motion — entry &amp; exit animation
                </h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Tune the open and close transitions independently. Easing
                  values accept any CSS easing string or a cubic-bezier array
                  literal like{" "}
                  <code className="font-mono text-[0.72rem]">
                    [0.23, 1, 0.32, 1]
                  </code>
                  .
                </p>
                <PropTable props={MOTION_ENTRY_EXIT_PROPS} />
              </div>

              <div>
                <h3 className="mb-1 text-sm">ui.motion — drag physics</h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Spring and threshold values that govern mobile drag-to-dismiss
                  behaviour.
                </p>
                <PropTable props={MOTION_DRAG_PROPS} />
              </div>

              <div>
                <h3 className="mb-1 text-sm">ui.motion — animated backdrop</h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Backdrop properties driven by the motion layer. These animate
                  in sync with the open/close spring rather than being applied
                  statically.
                </p>
                <PropTable props={MOTION_BACKDROP_PROPS} />
              </div>
            </div>
          </Section>
        </main>
      </div>

      {isConfigInView ? (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="fixed bottom-4 right-4 z-50 inline-flex h-9 items-center gap-2 border border-foreground/10 bg-background/90 px-3 text-xs font-semibold text-foreground/70 transition-colors hover:border-foreground/20 hover:text-foreground backdrop-blur-sm"
        >
          <kbd className="font-mono border border-foreground/15 bg-foreground/8 px-1 py-px text-[0.55rem] text-foreground/50">
            L Shift
          </kbd>
          {isOpen ? "Close" : "Open"} drawer
        </button>
      ) : null}

      <AuthDrawer
        adapter={adapter}
        config={config}
        hideTrigger
        open={isOpen}
        onOpenChange={(open) => {
          setOpen(open);
          if (!open) setDrawerAuthOverride(null);
        }}
      />
    </div>
  );
}
