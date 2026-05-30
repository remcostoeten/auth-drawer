import type { Metadata } from "next";
import { MediumPaywallExamplePage } from "@/components/pages/medium-paywall-example-page";

export const metadata: Metadata = {
  title: "Stop Rebuilding Login Modals",
  description:
    "Medium-style essay on why to use @remcostoeten/auth-drawer — with a live scroll-trigger paywall demo.",
};

export default function MediumPaywallExampleRoute() {
  return <MediumPaywallExamplePage />;
}
