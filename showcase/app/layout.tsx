import type { Metadata, Viewport } from "next";
import "../src/index.css";

export const metadata: Metadata = {
  title: {
    default: "Auth Drawer - React auth drawer and modal",
    template: "%s | Auth Drawer",
  },
  description:
    "Configurable React auth drawer and modal with OAuth, triggers, motion, and visual customization.",
  metadataBase: new URL("https://auth-drawer.remcostoeten.nl"),
  openGraph: {
    title: "Auth Drawer",
    description:
      "Configurable React auth drawer and modal with OAuth, triggers, motion, and visual customization.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Auth Drawer",
    description:
      "Configurable React auth drawer and modal with OAuth, triggers, motion, and visual customization.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        <div id="auth-drawer-portal" />
      </body>
    </html>
  );
}
