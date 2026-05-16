import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

/**
 * Renders compact keyboard input affordances.
 *
 * @param props - Rendered key content.
 * @returns Inline keyboard label.
 */
export function Kbd({ children }: Props) {
  return (
    <kbd className="ml-1.5 inline-flex h-5 items-center rounded-none border border-overlay-border/20 bg-overlay-surface/60 px-1.5 text-[10px] font-medium text-overlay-subtle">
      {children}
    </kbd>
  );
}
