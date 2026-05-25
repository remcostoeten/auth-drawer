"use client";

import { Play, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CodeBlock } from "../code/server-code-block";
import {
  TabbedCodeBlock,
  createPackageInstallVariants,
} from "../code/tabbed-code-block";
import {
  AuthDrawer,
  DEFAULT_CONFIG,
  type AuthConfig,
  type AuthConfigGroup,
} from "@/components/auth/auth-drawer";
import { Configurator } from "./configurator/configurator";
import { OAUTH_OVERFLOW_PROVIDERS } from "./configurator/constants";
import { buildConfig, DEFAULT_USAGE_CODE, initBackdrop, initCopy, initMotion } from "./configurator/helpers";
import { DocsAssistant } from "./docs-assistant";
import { DocsSidebarBrand, DocsSidebarNav } from "./docs-sidebar-nav";
import { OAuthDocsSection } from "./oauth-docs-section";
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

export function DocsPage() {
  const [isOpen, setOpen] = useState(false);
  const [drawerAuthOverride, setDrawerAuthOverride] =
    useState<Partial<AuthConfigGroup> | null>(null);
  const [isConfigInView, setConfigInView] = useState(false);
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

  return (
    <div className="docs-root min-h-screen bg-background text-foreground">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:px-8">
        <aside className="hidden lg:block">
          <div className="sticky top-16">
            <DocsSidebarBrand />
            <DocsSidebarNav />
          </div>
        </aside>

        <main className="min-w-0">
          <Section id="start" title="Start" eyebrow="Introduction">
            <DocsAssistant />
            <p className="mb-4 max-w-2xl text-sm leading-6 text-foreground/58">
              <strong className="text-foreground">Auth Drawer</strong> is a
              configurable, animated authentication surface for React. It ships
              as a mobile-optimised bottom-sheet drawer that can also render as
              a centred modal on desktop, with a single, type-safe config object
              controlling every visual, motion, behavioural, and copy detail.
            </p>
            <p className="mb-6 max-w-2xl text-sm leading-6 text-foreground/58">
              Bring your own auth backend — Supabase, Better Auth, Lucia, custom
              sessions, or anything else. Pass async handlers via{" "}
              <code className="font-mono text-[0.72rem]">onCredential</code> and{" "}
              <code className="font-mono text-[0.72rem]">onOAuth</code>.
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
              Install and render — styles ship with the component import. No
              Tailwind setup, no separate CSS file.
            </p>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold text-foreground/72">
                  1. Install
                </p>
                <TabbedCodeBlock
                  variants={createPackageInstallVariants(
                    "@remcostoeten/auth-drawer",
                  )}
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-foreground/72">
                  2. Render
                </p>
                <CodeBlock>{DEFAULT_USAGE_CODE}</CodeBlock>
              </div>
            </div>
          </Section>

          <Section id="showcase" title="Defaults" eyebrow="Out of the box">
            <p className="max-w-2xl text-sm leading-6 text-foreground/58">
              <code className="font-mono text-[0.72rem]">DEFAULT_CONFIG</code>{" "}
              ships with GitHub and Google OAuth, login and register tabs,
              remember-me, forgot-password, backdrop, drag behaviour, and trigger
              hooks. The same config shape covers drawer vs modal presentation,
              desktop width, position, and scroll or idle open triggers — customize
              only what you need in the{" "}
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
                  Top-level component props. All fields are optional.
                </p>
                <PropTable props={AUTH_DRAWER_PROPS} />
              </div>

              <div>
                <h3 className="mb-1 text-sm">AuthConfig shape</h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Passed to{" "}
                  <code className="font-mono text-[0.72rem]">config</code>.
                  Groups UI controls, activation triggers, and auth handlers.
                </p>
                <PropTable props={CONFIG_PROPS} />
              </div>

              <div id="api-triggers" className="scroll-mt-24">
                <h3 className="mb-1 text-sm">config.triggers — AuthTriggerConfig</h3>
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
                  <code className="font-mono text-[0.72rem]">TriggerPolicy</code>.
                  Fields below apply to every kind unless noted.
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
