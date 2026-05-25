"use client";

import { useMemo, useState } from "react";
import { AuthDrawer, DEFAULT_CONFIG } from "@/components/auth/auth-drawer";
import { createAuthTriggerStore } from "@remcostoeten/auth-drawer";
import { WindowsXpScene } from "@/components/debug/scenes/windows-xp";
import { createScenarioAdapter } from "@/components/debug/auth-scenarios";
import { AppNav } from "@/components/app-nav";

export function WindowsXpPage() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const triggerStore = useMemo(() => createAuthTriggerStore(), []);
  const adapter = useMemo(() => createScenarioAdapter("success"), []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <AppNav />
      <WindowsXpScene onOpenAuth={() => setDrawerOpen(true)} desktop={desktop}>
        <AuthDrawer
          adapter={adapter}
          config={DEFAULT_CONFIG}
          triggerStore={triggerStore}
          hideTrigger
          open={isDrawerOpen}
          onOpenChange={setDrawerOpen}
          onSuccess={() => setDesktop(true)}
        />
      </WindowsXpScene>
    </div>
  );
}
