import { createMemo, type Accessor } from "solid-js";
import type { OpenBinding } from "@remcostoeten/auth-drawer/core";

type OpenProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type ProviderOpen = {
  isDrawerOpen: Accessor<boolean>;
  openDrawer: () => void;
  closeDrawer: () => void;
};

type OpenMode = "controlled" | "provider" | "internal";

/**
 * @name createOpenBinding
 * @description Chooses who owns the drawer's open state. An explicit `open` prop wins, then the
 * surrounding `AuthProvider` when neither `open` nor `onOpenChange` is given, and otherwise the
 * controller keeps it internally (no binding). The binding reads its owner live.
 *
 * @example
 * const binding = createOpenBinding(props, useOptionalAuth());
 */
export function createOpenBinding(
  props: OpenProps,
  provider: ProviderOpen | undefined,
): Accessor<OpenBinding | undefined> {
  const mode = createMemo<OpenMode>(() => {
    if (props.open !== undefined) return "controlled";
    if (props.onOpenChange === undefined && provider !== undefined) return "provider";
    return "internal";
  });

  return createMemo(() => {
    const current = mode();

    if (current === "controlled") {
      return { get: () => Boolean(props.open), set: (next) => props.onOpenChange?.(next) };
    }

    if (current === "provider" && provider) {
      return {
        get: () => provider.isDrawerOpen(),
        set: (next) => (next ? provider.openDrawer() : provider.closeDrawer()),
      };
    }

    return undefined;
  });
}
