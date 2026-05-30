import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Better Auth + Auth Drawer Example",
  description:
    "Next.js reference app with Better Auth, Drizzle, PostgreSQL, and @remcostoeten/auth-drawer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        <AuthShell>
          <SiteHeader />
          {children}
        </AuthShell>
        <div id="auth-drawer-portal" />
      </body>
    </html>
  );
}
