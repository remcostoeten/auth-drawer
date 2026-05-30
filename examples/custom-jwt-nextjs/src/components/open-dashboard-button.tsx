"use client";

import { useAuth } from "@remcostoeten/auth-drawer";

export function OpenDashboardButton() {
  const { user, isPending, openDrawer } = useAuth();

  if (isPending || user) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={openDrawer}
      className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
    >
      Open dashboard
    </button>
  );
}
