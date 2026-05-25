import type { Metadata } from "next";
import { WindowsXpPage } from "@/components/pages/windows-xp-page";

export const metadata: Metadata = {
  title: "Windows XP Playground",
  description: "Windows XP-themed Auth Drawer demo with boot screen, login, and desktop.",
};

export default function WindowsXpRoute() {
  return <WindowsXpPage />;
}
