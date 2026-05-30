import type { Metadata } from "next";
import { RedirectToDocs } from "@/components/redirect-to-docs";

export const metadata: Metadata = {
  title: "Provider Examples",
  description: "Redirecting to SDK adapter docs.",
  robots: { index: false, follow: true },
};

export default function ExamplesIndexPage() {
  return <RedirectToDocs hash="sdk-adapters" />;
}
