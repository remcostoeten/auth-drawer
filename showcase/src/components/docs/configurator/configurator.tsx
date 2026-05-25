import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Play, SlidersHorizontal } from "lucide-react";
import {
  resolveOAuthVisibleCount,
  type AuthConfig,
  type AuthConfigGroup,
  type AuthOAuthOverflowConfig,
  type DrawerMode,
  type MotionSettings,
  type OAuthProvider,
  type ResolvedAuthCopyConfig,
} from "@/components/auth/auth-drawer";
import { CodeBlock } from "../../code/server-code-block";
import { DefaultConfigPopover } from "../default-config-popover";
import {
  CONFIG_CODE_STICKY_GAP_PX,
  DOCS_NAV_HEIGHT_PX,
  type ConfiguratorTab,
} from "./constants";
import { ConfiguratorProvider } from "./context";
import {
  buildConfig,
  CONFIGURATOR_DEFAULTS,
  initBackdrop,
  initCopy,
  initMotion,
  isStockConfiguratorState,
} from "./helpers";
import { AuthConfiguratorTab } from "./tabs/auth-tab";
import { CopyConfiguratorTab } from "./tabs/copy-tab";
import { MotionConfiguratorTab } from "./tabs/motion-tab";
import { VisualConfiguratorTab } from "./tabs/visual-tab";
import { ConfiguratorToolbar } from "./toolbar";
import { buildUsageCode } from "./usage-code";

export type ConfiguratorProps = {
  onPreview: (authOverride: Partial<AuthConfigGroup> | null) => void;
  onConfigChange: (config: AuthConfig) => void;
  onInViewChange: (inView: boolean) => void;
  authOverride: Partial<AuthConfigGroup> | null;
};

export function Configurator({
  onPreview,
  onConfigChange,
  onInViewChange,
  authOverride,
}: ConfiguratorProps) {
  const [isExpanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<ConfiguratorTab>("auth");
  const [mode, setMode] = useState<DrawerMode>("drawer");
  const [auth, setAuth] = useState<AuthConfigGroup>({
    ...CONFIGURATOR_DEFAULTS.auth,
    oauthOverflow: { ...CONFIGURATOR_DEFAULTS.auth.oauthOverflow },
  });
  const [copy, setCopy] = useState<ResolvedAuthCopyConfig>(initCopy);
  const [backdrop, setBackdrop] = useState(initBackdrop);
  const [motion, setMotion] = useState(initMotion);
  const [isToolbarDocked, setToolbarDocked] = useState(false);
  const [toolbarHeight, setToolbarHeight] = useState(88);

  const sectionRef = useRef<HTMLDivElement>(null);
  const toolbarSentinelRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => onInViewChange(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onInViewChange]);

  useEffect(() => {
    if (!isExpanded) {
      setToolbarDocked(false);
      return;
    }

    const sentinel = toolbarSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setToolbarDocked(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-36px 0px 0px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isExpanded]);

  useLayoutEffect(() => {
    if (!isExpanded) return;

    const toolbar = toolbarRef.current;
    if (!toolbar) return;

    const updateHeight = () => {
      setToolbarHeight(toolbar.getBoundingClientRect().height);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(toolbar);
    return () => observer.disconnect();
  }, [isExpanded, isToolbarDocked]);

  const codeStickyTopPx =
    DOCS_NAV_HEIGHT_PX + toolbarHeight + CONFIG_CODE_STICKY_GAP_PX;

  function resetConfig() {
    setMode("drawer");
    setAuth({
      ...CONFIGURATOR_DEFAULTS.auth,
      oauthOverflow: { ...CONFIGURATOR_DEFAULTS.auth.oauthOverflow },
    });
    setCopy(initCopy());
    setBackdrop(initBackdrop());
    setMotion(initMotion());
  }

  function updateAuth<K extends keyof AuthConfigGroup>(
    key: K,
    value: AuthConfigGroup[K],
  ) {
    setAuth((prev) => ({ ...prev, [key]: value }));
  }

  function cycleProvider(provider: OAuthProvider) {
    setAuth((prev) => ({
      ...prev,
      providers: prev.providers?.includes(provider)
        ? prev.providers.filter((p) => p !== provider)
        : [...(prev.providers ?? []), provider],
    }));
  }

  function updateOAuthOverflow<K extends keyof AuthOAuthOverflowConfig>(
    key: K,
    value: NonNullable<AuthOAuthOverflowConfig[K]>,
  ) {
    setAuth((prev) => ({
      ...prev,
      oauthOverflow: {
        ...(prev.oauthOverflow ?? CONFIGURATOR_DEFAULTS.auth.oauthOverflow),
        [key]: value,
      },
    }));
  }

  const oauthVisibleCount = resolveOAuthVisibleCount(
    auth.oauthOverflow?.visibleCount ??
      CONFIGURATOR_DEFAULTS.auth.oauthOverflow.visibleCount,
  );
  const providerCount = auth.providers?.length ?? 0;
  const hasOAuthOverflow = providerCount > oauthVisibleCount;

  function updateBackdrop<K extends keyof ReturnType<typeof initBackdrop>>(
    key: K,
    value: ReturnType<typeof initBackdrop>[K],
  ) {
    setBackdrop((prev) => ({ ...prev, [key]: value }));
  }

  function updateGradient<
    K extends keyof ReturnType<typeof initBackdrop>["gradient"],
  >(
    key: K,
    value: ReturnType<typeof initBackdrop>["gradient"][K],
  ) {
    setBackdrop((prev) => ({
      ...prev,
      gradient: { ...prev.gradient, [key]: value },
    }));
  }

  function updateMotion<K extends keyof MotionSettings>(
    key: K,
    value: MotionSettings[K],
  ) {
    setMotion((prev) => ({ ...prev, [key]: value }));
  }

  const effectiveAuth = useMemo(
    () => (authOverride ? { ...auth, ...authOverride } : auth),
    [auth, authOverride],
  );

  const config = useMemo(
    () =>
      buildConfig({
        mode,
        auth: effectiveAuth,
        copy,
        backdrop,
        motion,
      }),
    [mode, effectiveAuth, copy, backdrop, motion],
  );

  useEffect(() => {
    onConfigChange(config);
  }, [config, onConfigChange]);

  const isStockConfig = useMemo(
    () =>
      isStockConfiguratorState({
        mode,
        auth,
        copy,
        backdrop,
        motion,
      }),
    [mode, auth, copy, backdrop, motion],
  );

  const usageCode = useMemo(
    () => buildUsageCode({ mode, auth, copy, backdrop, motion }),
    [mode, auth, copy, backdrop, motion],
  );

  const contextValue = useMemo(
    () => ({
      mode,
      setMode,
      auth,
      setAuth,
      copy,
      setCopy,
      backdrop,
      motion,
      oauthVisibleCount,
      providerCount,
      hasOAuthOverflow,
      updateAuth,
      cycleProvider,
      updateOAuthOverflow,
      updateBackdrop,
      updateGradient,
      updateMotion,
    }),
    [
      mode,
      auth,
      copy,
      backdrop,
      motion,
      oauthVisibleCount,
      providerCount,
      hasOAuthOverflow,
    ],
  );

  return (
    <div ref={sectionRef}>
      {!isExpanded ? (
        <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(18rem,0.55fr)] lg:items-center">
            <div>
              <div className="mb-3 inline-flex h-8 items-center gap-2 rounded-[5px] border border-foreground/10 bg-background px-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-foreground/46">
                <SlidersHorizontal size={13} aria-hidden="true" />
                Advanced
              </div>
              <h3 className="text-base text-foreground">
                Customize when the defaults are not enough
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/58">
                The{" "}
                <DefaultConfigPopover
                  label="full configurator"
                  triggerClassName="inline cursor-help border-b border-dotted border-foreground/28 text-foreground/58 transition-[color,border-color] duration-150 ease-out hover:border-foreground/45 hover:text-foreground/78"
                />{" "}
                is still here, but it stays collapsed until someone wants to
                tune providers, visual treatment, motion, drag physics, and
                generated config output.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <button
                type="button"
                onClick={() => onPreview(null)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[5px] bg-foreground px-4 text-sm font-semibold text-background transition-transform active:scale-[0.98]"
              >
                <Play size={14} aria-hidden="true" />
                Show default
              </button>
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[5px] border border-foreground/10 bg-background px-4 text-sm font-semibold text-foreground/68 transition-colors hover:border-foreground/22 hover:text-foreground"
              >
                <SlidersHorizontal size={14} aria-hidden="true" />
                Open configurator
              </button>
            </div>
          </div>
        </div>
      ) : (
        <ConfiguratorProvider value={contextValue}>
          <div
            style={
              {
                "--config-toolbar-h": `${toolbarHeight}px`,
              } as CSSProperties
            }
          >
            <div
              ref={toolbarSentinelRef}
              className="pointer-events-none h-px w-full"
              aria-hidden="true"
            />
            <div
              ref={toolbarRef}
              className={
                isToolbarDocked
                  ? "sticky top-9 z-30 -mx-4 mb-6 border-b border-foreground/10 bg-background/95 px-4 py-2.5 shadow-[0_10px_32px_-18px_rgba(0,0,0,0.55)] backdrop-blur-md transition-[box-shadow,background-color,border-radius,padding,margin] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
                  : "sticky top-9 z-30 mb-6 rounded-[8px] border border-foreground/10 bg-background/90 p-3 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.45)] backdrop-blur-md transition-[box-shadow,background-color,border-radius,padding,margin] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
              }
            >
              <ConfiguratorToolbar
                tab={tab}
                onTabChange={setTab}
                onShowCurrent={() => onPreview(null)}
                onReset={resetConfig}
                onCollapse={() => setExpanded(false)}
              />
            </div>

            <div className="grid gap-8 xl:grid-cols-[minmax(20rem,0.82fr)_minmax(0,1.18fr)] xl:items-start">
              <div className="min-w-0 space-y-3">
                {tab === "auth" ? <AuthConfiguratorTab /> : null}
                {tab === "copy" ? <CopyConfiguratorTab /> : null}
                {tab === "visual" ? <VisualConfiguratorTab /> : null}
                {tab === "motion" ? <MotionConfiguratorTab /> : null}
              </div>

              <div
                className="custom-scrollbar min-w-0 space-y-3 xl:sticky xl:z-20 xl:max-h-[calc(100vh-2.25rem-var(--config-toolbar-h,5.5rem)-1.5rem)] xl:self-start xl:overflow-y-auto xl:transition-[top] xl:duration-200 xl:ease-[cubic-bezier(0.23,1,0.32,1)]"
                style={{ top: `${codeStickyTopPx}px` }}
              >
                {isStockConfig ? (
                  <p className="text-xs leading-5 text-foreground/52">
                    Stock defaults — this is the same config{" "}
                    <code className="font-mono text-[0.68rem]">
                      DEFAULT_CONFIG
                    </code>{" "}
                    uses internally. For the stock drawer,{" "}
                    <code className="font-mono text-[0.68rem]">
                      &lt;AuthDrawer /&gt;
                    </code>{" "}
                    is enough; wire up handlers only when you integrate auth.
                  </p>
                ) : (
                  <p className="text-xs leading-5 text-foreground/52">
                    Custom config — copy the values you changed. Unchanged
                    defaults are omitted where possible.
                  </p>
                )}
                <CodeBlock>{usageCode}</CodeBlock>
              </div>
            </div>
          </div>
        </ConfiguratorProvider>
      )}
    </div>
  );
}
