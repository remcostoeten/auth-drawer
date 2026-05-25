import type { Metadata } from "next";
import { ShowcaseApp } from "@/components/showcase-app";

export const metadata: Metadata = {
  title: "Playground",
  description:
    "Interactive Auth Drawer playground for configuring drawer, modal, OAuth, copy, motion, and triggers.",
};

export default function PlaygroundPage() {
  return <ShowcaseApp initialView="lab" />;
}
