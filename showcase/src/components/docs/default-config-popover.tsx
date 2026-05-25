import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DEFAULT_CONFIG } from "@/components/auth/auth-drawer";
import { CodeBlock } from "../code/server-code-block";

function indentObject(label: string, value: unknown) {
  const lines = JSON.stringify(value, null, 2).split("\n");
  return [
    `  ${label}: ${lines[0]}`,
    ...lines.slice(1).map((line) => `  ${line}`),
  ].join("\n");
}

function formatDefaultConfigPreview() {
  return [
    "export const DEFAULT_CONFIG = {",
    `${indentObject("ui", DEFAULT_CONFIG.ui)},`,
    `${indentObject("triggers", DEFAULT_CONFIG.triggers)},`,
    "  onCredential: async (input) => { /* noop */ },",
    "  onOAuth: async (provider) => { /* noop */ },",
    "  onForgotPassword: async (email) => { /* noop */ },",
    "  normalizeError: (error) => error,",
    "};",
  ].join("\n");
}

type DefaultConfigPopoverProps = {
  label?: string;
  triggerClassName?: string;
};

export function DefaultConfigPopover({
  label = "DEFAULT_CONFIG",
  triggerClassName,
}: DefaultConfigPopoverProps) {
  const popoverId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const code = useMemo(() => formatDefaultConfigPreview(), []);

  const updatePosition = () => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const panelWidth = panel?.offsetWidth ?? 560;
    const panelHeight = panel?.offsetHeight ?? 420;
    const margin = 16;
    const gap = 8;

    const maxLeft = Math.max(margin, window.innerWidth - panelWidth - margin);
    const left = Math.min(Math.max(margin, rect.left - panelWidth / 3), maxLeft);

    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const openAbove = spaceBelow < panelHeight && spaceAbove > spaceBelow;

    const top = openAbove
      ? Math.max(margin, rect.top - panelHeight - gap)
      : Math.min(rect.bottom + gap, window.innerHeight - panelHeight - margin);

    setPosition({ top, left });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);
    return () => window.cancelAnimationFrame(frame);
  }, [open, code]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const onResize = () => updatePosition();
    const onScroll = () => updatePosition();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={() => setOpen((current) => !current)}
        className={triggerClassName ?? "cursor-help border-b border-dotted border-foreground/28 text-foreground/55 transition-[color,border-color,transform] duration-150 ease-out hover:border-foreground/45 hover:text-foreground/78 active:scale-[0.98]"}
      >
        {label}
      </button>

      {open
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Close default config preview"
                className="fixed inset-0 z-[400] cursor-default bg-transparent"
                onClick={() => setOpen(false)}
              />
              <div
                ref={panelRef}
                id={popoverId}
                role="dialog"
                aria-label="DEFAULT_CONFIG preview"
                className="fixed z-[401] flex w-[min(36rem,calc(100vw-2rem))] max-h-[min(32rem,calc(100vh-2rem))] flex-col overflow-hidden rounded-[8px] border border-foreground/12 bg-[#0b0b0c] shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
                style={{
                  top: position.top,
                  left: position.left,
                  transformOrigin: `${Math.max(0, (triggerRef.current?.getBoundingClientRect().left ?? 0) - position.left + 24)}px 0`,
                  animation: "default-config-popover-in 180ms cubic-bezier(0.23, 1, 0.32, 1)",
                }}
              >
                <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-2">
                  <p className="font-mono text-[0.68rem] font-medium text-white/72">
                    DEFAULT_CONFIG
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-[4px] px-2 py-1 text-[0.65rem] font-medium text-white/42 transition-[color,transform] duration-150 ease-out hover:text-white/72 active:scale-[0.97]"
                  >
                    Close
                  </button>
                </div>
                <div className="custom-scrollbar group/code min-h-0 flex-1 overflow-y-auto overflow-x-auto">
                  <CodeBlock lang="typescript" embedded>
                    {code}
                  </CodeBlock>
                </div>
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
