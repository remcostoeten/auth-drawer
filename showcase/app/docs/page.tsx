import type { Metadata } from "next";
import { ShowcaseApp } from "@/components/showcase-app";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "Auth Drawer documentation for installation, OAuth, triggers, customization, and API props.",
};

export default function DocsPageRoute() {
  return <ShowcaseApp initialView="docs" />;
}
