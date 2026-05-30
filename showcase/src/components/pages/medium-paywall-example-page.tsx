"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, ChevronDown, Hand, MessageCircle, MoreHorizontal, Share } from "lucide-react";
import { AuthDrawer, DEFAULT_CONFIG } from "@/components/auth/auth-drawer";
import { createAuthTriggerStore, useScrollOpenTrigger } from "@remcostoeten/auth-drawer";
import { AUTH_SCENARIOS, createScenarioAdapter, type AuthScenarioId } from "@/components/debug/auth-scenarios";
import type { AuthConfig } from "@/components/auth/auth-drawer";
import { AppNav } from "@/components/app-nav";

const articleParagraphs = [
  "Every product team I have worked with has rebuilt the same login surface at least twice. Email field, password field, forgot-password link, OAuth row, register tab, error states that land in the wrong place. It is never the hard part of the roadmap, and yet it eats a week every time you switch auth providers or redesign the app.",
  "That repetition is what pushed me to package Auth Drawer: a single React auth surface that can render as a bottom sheet on mobile or a centered modal on desktop, wired to your backend through a small adapter instead of hard-coded SDK calls in the UI layer.",
  "The idea is boring on purpose. Your app should not care whether sessions live in Better Auth, Supabase, Clerk, or a custom JWT API. The drawer should ask the adapter for sign-in, sign-up, OAuth, and session state — and hide anything the adapter does not support. No register tab if there is no signUp. No GitHub button if OAuth is not configured. The UI follows the contract, not a giant prop matrix.",
  "Configuration stays declarative. One AuthConfig object controls copy, motion, backdrop, which OAuth providers appear, and when the drawer opens on its own. Scroll past a threshold on a member-only article? Open the drawer once. Idle on a pricing page? Same trigger system. Click a nav button? That too. You are not sprinkling useEffect hooks across marketing pages.",
  "For paywalls specifically, scroll-open triggers are the detail that sells the pattern. Readers engage with the story first; the auth surface appears when they have skin in the game — not on first paint, not in a blocking modal that feels like a pop-up ad. This page is a deliberate clone of that moment: keep reading, hit about a quarter of the scroll depth, and the drawer arrives.",
  "Adapters are typed and swappable. Better Auth, Supabase, NextAuth, Clerk, Firebase, custom REST, Passport, or a mock for demos — each lives in a subpath import. Swap the adapter, keep the drawer. Swap the drawer styling through config, keep the adapter. That separation is the whole product thesis.",
  "OAuth overflow, email autocomplete domains, forgot-password flows, and normalized error copy are included because real auth is never only sign-in. The defaults are opinionated enough to ship; the configurator in the docs exists for teams that want pixel-level control without forking components.",
  "If you are evaluating auth UI, ask one question: how much of your codebase knows about provider-specific APIs versus a single AuthAdapter? Auth Drawer is my answer — fewer bespoke modals, one surface users recognize, and triggers that respect how people actually read before they sign up.",
  "Install is one package. Styles ship with the import. Wrap AuthProvider, render AuthDrawer, pass the adapter. The docs ship two runnable playground examples so you can feel the triggers before you paste code into your app.",
];

const playgroundExamples = [
  {
    title: "Medium Paywall",
    href: "/playground/medium-paywall-example",
    trigger: "Scroll threshold",
    read: "You are here",
    blurb:
      "Member-only article flow: read a preview, cross ~25% scroll depth, and the drawer opens once — the same scrollOpen pattern documented under Triggers.",
  },
  {
    title: "Windows XP",
    href: "/playground/windows-xp",
    trigger: "Click / login",
    read: "5 min demo",
    blurb:
      "Boot screen, classic login, and desktop: open auth from an explicit sign-in CTA — the click-trigger story from the docs, nostalgia included.",
  },
] as const;

const moreArticles = [
  {
    title: "Medium Paywall — scroll-triggered auth",
    href: "/playground/medium-paywall-example",
    read: "Live demo",
    date: "Playground",
    publication: "Auth Drawer docs",
  },
  {
    title: "Windows XP — click-to-sign-in auth",
    href: "/playground/windows-xp",
    read: "Live demo",
    date: "Playground",
    publication: "Auth Drawer docs",
  },
];

const comments = [
  {
    name: "Jonah Park",
    time: "2 days ago",
    text: "The scroll trigger on this page is the best demo I've seen for paywall UX. Felt natural, not aggressive.",
    claps: 41,
  },
  {
    name: "Rina Okafor",
    time: "4 days ago",
    text: "We migrated from a hand-rolled modal to the Better Auth adapter in an afternoon. Register tab appeared automatically when we enabled signUp.",
    claps: 67,
  },
  {
    name: "Marcus Bell",
    time: "1 week ago",
    text: "Ran both playground examples from the Triggers docs — Medium scroll vs Windows XP click — and finally understood when to use each.",
    claps: 19,
  },
];

type PaywallText = { badge: string; message: string; button: string };
type DrawerCopy = { title: string; subtitle: string; submit: string };

const PAYWALL_TEXT: Record<AuthScenarioId, PaywallText> = {
  success: {
    badge: "Member-only story",
    message:
      "The rest of this piece covers adapters, triggers, and install — or keep scrolling: the Auth Drawer opens automatically at 25% scroll on this demo.",
    button: "Sign in to read the full story",
  },
  invalid_credentials: {
    badge: "Restricted content",
    message: "We couldn't verify your credentials. Please try logging in again.",
    button: "Try signing in",
  },
  email_taken: {
    badge: "Account conflict",
    message: "This email is already registered. Sign in to continue reading.",
    button: "Sign in to your account",
  },
  email_not_verified: {
    badge: "Email required",
    message: "Please verify your email address before accessing this story.",
    button: "Resend verification",
  },
  user_not_found: {
    badge: "Account required",
    message: "No account found for this email. Create one to keep reading.",
    button: "Create an account",
  },
  network_error: {
    badge: "Connection issue",
    message: "We're having trouble connecting. Please check your network and try again.",
    button: "Retry",
  },
  rate_limited: {
    badge: "Too many attempts",
    message: "You've made too many requests. Please wait a moment before trying again.",
    button: "Try again later",
  },
  server_error: {
    badge: "Service unavailable",
    message: "Our authentication service is temporarily down. We're working on it.",
    button: "Try again",
  },
  oauth_cancelled: {
    badge: "Sign-in cancelled",
    message: "The sign-in window was closed. Click below to try again.",
    button: "Sign in again",
  },
  popup_blocked: {
    badge: "Popup blocked",
    message: "Your browser blocked the sign-in popup. Allow popups and try again.",
    button: "Enable popups",
  },
  provider_unavailable: {
    badge: "Provider offline",
    message: "The selected sign-in provider is currently unavailable. Try a different method.",
    button: "Choose another provider",
  },
};

const DRAWER_COPY: Record<AuthScenarioId, DrawerCopy> = {
  success: {
    title: "Continue reading",
    subtitle: "Sign in with Auth Drawer — the same surface wired in the docs",
    submit: "Sign in",
  },
  invalid_credentials: {
    title: "Welcome back",
    subtitle: "Please check your email and password and try again",
    submit: "Sign in",
  },
  email_taken: {
    title: "Account already exists",
    subtitle: "This email is already registered. Sign in to continue reading.",
    submit: "Sign in",
  },
  email_not_verified: {
    title: "Verify your email",
    subtitle: "Check your inbox for the verification link before signing in",
    submit: "Resend verification",
  },
  user_not_found: {
    title: "No account found",
    subtitle: "Create an account to keep reading this story",
    submit: "Create account",
  },
  network_error: {
    title: "Connection issue",
    subtitle: "We can't reach our servers right now. Check your network.",
    submit: "Try again",
  },
  rate_limited: {
    title: "Too many attempts",
    subtitle: "Please wait a moment before trying to sign in again",
    submit: "Try again later",
  },
  server_error: {
    title: "Service unavailable",
    subtitle: "Our authentication service is temporarily down",
    submit: "Retry",
  },
  oauth_cancelled: {
    title: "Sign in cancelled",
    subtitle: "The sign-in window was closed. Tap below to try again.",
    submit: "Sign in",
  },
  popup_blocked: {
    title: "Popup blocked",
    subtitle: "Allow popups for this site and try signing in again",
    submit: "Enable popups",
  },
  provider_unavailable: {
    title: "Provider unavailable",
    subtitle: "That sign-in method isn't available right now. Try a different one.",
    submit: "Choose another",
  },
};

export function MediumPaywallExamplePage() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [scenario, setScenario] = useState<AuthScenarioId>("success");
  const [selectorOpen, setSelectorOpen] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const triggerStore = useMemo(() => createAuthTriggerStore(), []);
  const adapter = useMemo(() => createScenarioAdapter(scenario), [scenario]);
  const paywall = PAYWALL_TEXT[scenario];
  const drawerCopy = DRAWER_COPY[scenario];
  const config = useMemo<AuthConfig>(
    () => ({
      ...DEFAULT_CONFIG,
      ui: {
        ...DEFAULT_CONFIG.ui,
        copy: {
          login: {
            title: drawerCopy.title,
            subtitle: drawerCopy.subtitle,
            submit: drawerCopy.submit,
          },
        },
      },
    }),
    [drawerCopy],
  );
  const selectedScenario = AUTH_SCENARIOS.find((s) => s.id === scenario);

  const [isAuthenticated, setAuthenticated] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "failure"; message: string } | null>(null);
  const succeededRef = useRef(false);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  function showFeedback(type: "success" | "failure", message: string) {
    clearTimeout(feedbackTimeout.current);
    setFeedback({ type, message });
    feedbackTimeout.current = setTimeout(() => setFeedback(null), 4000);
  }

  useEffect(() => {
    return () => clearTimeout(feedbackTimeout.current);
  }, []);

  useEffect(() => {
    setAuthenticated(false);
  }, [scenario]);

  function handleDrawerOpenChange(open: boolean) {
    setDrawerOpen(open);
    if (!open) {
      if (succeededRef.current) {
        succeededRef.current = false;
        setAuthenticated(true);
        showFeedback("success", "Signed in — Auth Drawer demo complete.");
      } else {
        const isErrorScenario = scenario !== "success";
        if (isErrorScenario) {
          const label = selectedScenario?.label ?? scenario;
          showFeedback("failure", `${label}: ${selectedScenario?.description ?? "Auth failed"}`);
        }
      }
    }
  }

  useScrollOpenTrigger({
    containerRef: sceneRef,
    onTrigger: () => setDrawerOpen(true),
    threshold: 0.25,
    once: true,
    enabled: true,
  });

  function openAuth() {
    setDrawerOpen(true);
  }

  return (
    <>
      <AppNav />
      <div
        ref={sceneRef}
        className={
          "fixed left-0 right-0 top-9 bottom-0 z-0 bg-white text-neutral-900 " +
          (isDrawerOpen ? "overflow-y-hidden" : "overflow-y-auto")
        }
        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
      >
        <div className="fixed right-4 top-4 z-20">
          <button
            type="button"
            onClick={() => setSelectorOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 shadow-sm hover:border-neutral-300 hover:text-neutral-900"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            <span>Scenario: {selectedScenario?.label}</span>
            <ChevronDown size={12} className={selectorOpen ? "rotate-180" : ""} />
          </button>
          {selectorOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
              {AUTH_SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setScenario(s.id);
                    setSelectorOpen(false);
                  }}
                  className={
                    s.id === scenario
                      ? "flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-neutral-900"
                      : "flex w-full items-center justify-between px-3 py-2 text-xs text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                  }
                >
                  <span>{s.label}</span>
                  {s.id === scenario && <span className="text-[10px] text-green-600">active</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {feedback && (
          <div
            className={
              "fixed left-1/2 top-12 z-30 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-medium shadow-lg transition-all " +
              (feedback.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white")
            }
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            {feedback.message}
          </div>
        )}

        <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
            <a
              href="/playground/medium-paywall-example"
              className="text-3xl font-bold tracking-tight"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Medium
            </a>
            <div className="flex items-center gap-5 text-sm" style={{ fontFamily: "system-ui, sans-serif" }}>
              <button type="button" className="hidden text-neutral-600 hover:text-neutral-900 sm:block">
                Our story
              </button>
              <button type="button" className="hidden text-neutral-600 hover:text-neutral-900 sm:block">
                Membership
              </button>
              <button type="button" className="hidden text-neutral-600 hover:text-neutral-900 sm:block">
                Write
              </button>
              <button type="button" onClick={openAuth} className="text-neutral-600 hover:text-neutral-900">
                Sign in
              </button>
              <button
                type="button"
                onClick={openAuth}
                className="rounded-full bg-neutral-900 px-4 py-1.5 text-white hover:bg-neutral-700"
              >
                Get started
              </button>
            </div>
          </div>
        </header>

        <article className="mx-auto max-w-3xl px-6 pb-24 pt-12">
          <p
            className="mb-4 text-sm text-neutral-500"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
              Product essay
            </span>
            {" · "}
            <a
              href="/docs"
              className="underline underline-offset-2 hover:text-neutral-800"
            >
              @remcostoeten/auth-drawer
            </a>
          </p>

          <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Stop Rebuilding Login Modals. Ship One Auth Drawer Instead.
          </h1>
          <h2 className="mb-10 text-xl font-normal leading-snug text-neutral-500 md:text-2xl">
            A provider-agnostic sign-in surface for React — with scroll triggers that feel like a
            paywall, not a billboard.
          </h2>

          <div className="mb-10 flex items-center gap-4" style={{ fontFamily: "system-ui, sans-serif" }}>
            <img src="/buu.svg" alt="" className="h-12 w-12 rounded-full object-cover" />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-neutral-900">Remco Stoeten</span>
                <button type="button" onClick={openAuth} className="text-sm font-medium text-green-700">
                  Follow
                </button>
              </div>
              <div className="text-sm text-neutral-500">
                9 min read · May 25, 2026 ·{" "}
                <span className="underline">Featured in Product &amp; Engineering</span>
              </div>
            </div>
          </div>

          <div
            className="mb-10 flex items-center justify-between border-y border-neutral-200 py-3"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            <div className="flex items-center gap-6 text-sm text-neutral-600">
              <button type="button" onClick={openAuth} className="flex items-center gap-1.5 hover:text-neutral-900">
                <Hand size={18} /> 2.8K
              </button>
              <button type="button" onClick={openAuth} className="flex items-center gap-1.5 hover:text-neutral-900">
                <MessageCircle size={18} /> 34
              </button>
            </div>
            <div className="flex items-center gap-5 text-neutral-600">
              <button type="button" onClick={openAuth} className="hover:text-neutral-900">
                <Bookmark size={18} />
              </button>
              <button type="button" onClick={openAuth} className="hover:text-neutral-900">
                <Share size={18} />
              </button>
              <button type="button" onClick={openAuth} className="hover:text-neutral-900">
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>

          <figure className="mb-10 -mx-6 md:mx-0">
            <div className="flex aspect-[16/9] w-full items-center justify-center bg-neutral-100 px-8 text-center">
              <p
                className="max-w-md text-lg leading-relaxed text-neutral-600"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                One drawer. Better Auth, Supabase, Clerk, NextAuth — swap the adapter, not the UI.
              </p>
            </div>
            <figcaption
              className="mt-3 px-6 text-center text-sm text-neutral-500"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              Auth Drawer on a member-only article — scroll to ~25% to see the trigger fire.
            </figcaption>
          </figure>

          <div className="prose-article space-y-7 text-[20px] leading-[1.7] text-neutral-800">
            <p className="first-letter:float-left first-letter:mr-2 first-letter:text-6xl first-letter:font-bold first-letter:leading-none first-letter:mt-1">
              {articleParagraphs[0]}
            </p>
            <p>{articleParagraphs[1]}</p>

            <h3 className="pt-6 text-3xl font-bold leading-tight">Adapters, not provider soup</h3>
            <p>{articleParagraphs[2]}</p>

            <blockquote className="my-10 border-l-4 border-neutral-900 pl-6 text-2xl italic text-neutral-700">
              &ldquo;The UI should follow the adapter contract — not a spreadsheet of booleans for
              which OAuth buttons might exist today.&rdquo;
            </blockquote>

            <p>{articleParagraphs[3]}</p>

            <figure className="my-10 -mx-6 md:mx-0">
              <div
                className="border border-neutral-200 bg-neutral-50 p-6"
                style={{ fontFamily: "ui-monospace, monospace" }}
              >
                <p className="mb-2 text-xs text-neutral-500">// scroll-open trigger (from the docs)</p>
                <pre className="overflow-x-auto text-sm leading-6 text-neutral-800">
{`useScrollOpenTrigger({
  containerRef: articleRef,
  onTrigger: () => openDrawer(),
  threshold: 0.25,
  once: true,
});`}
                </pre>
              </div>
              <figcaption
                className="mt-3 px-6 text-center text-sm text-neutral-500"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                This page runs the same pattern — that is the demo you are living inside.
              </figcaption>
            </figure>

            <h3 className="pt-6 text-3xl font-bold leading-tight">Paywalls that wait for intent</h3>
            <p>{articleParagraphs[4]}</p>
            <p>{articleParagraphs[5]}</p>

            <h3 className="pt-6 text-3xl font-bold leading-tight">What you get out of the box</h3>
            <p>{articleParagraphs[6]}</p>

            {isAuthenticated ? (
              <div
                className="my-8 rounded-lg border border-green-200 bg-green-50 p-4 text-center"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                <p className="text-sm font-semibold text-green-700">Story unlocked ✓</p>
                <p className="mt-1 text-sm text-green-600">
                  You&apos;re signed in. Continue reading below.
                </p>
              </div>
            ) : (
              <div
                className="my-8 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-center"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                <p className="mb-2 text-sm font-semibold text-neutral-500">{paywall.badge}</p>
                <p className="mb-3 text-sm text-neutral-600">{paywall.message}</p>
                <button
                  type="button"
                  onClick={openAuth}
                  className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700"
                >
                  {paywall.button}
                </button>
              </div>
            )}

            <h3 className="pt-6 text-3xl font-bold leading-tight">Two playground examples in the docs</h3>
            <p>{articleParagraphs[8]}</p>

            <div
              className="my-10 grid gap-4 sm:grid-cols-2"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              {playgroundExamples.map((example) => (
                <a
                  key={example.title}
                  href={example.href}
                  className="block rounded-lg border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-400 hover:shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                    {example.trigger}
                  </p>
                  <h4
                    className="mt-2 text-lg font-bold text-neutral-900"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {example.title}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{example.blurb}</p>
                  <p className="mt-3 text-xs text-neutral-500">{example.read} →</p>
                </a>
              ))}
            </div>

            <p className="text-[18px] text-neutral-700">
              Both live under{" "}
              <a href="/playground" className="underline underline-offset-2">
                Playground
              </a>{" "}
              in the nav, with full write-ups in the{" "}
              <a href="/docs#triggers" className="underline underline-offset-2">
                Triggers
              </a>{" "}
              section — scrollOpen for paywalls, click for explicit sign-in moments like a desktop
              login screen.
            </p>

            <h3 className="pt-6 text-3xl font-bold leading-tight">The case for one surface</h3>
            <p>{articleParagraphs[7]}</p>

            <ul
              className="list-disc space-y-2 pl-6 text-[18px] text-neutral-700"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              <li>Drawer and modal from the same config</li>
              <li>OAuth, email/password, register, forgot-password when your adapter supports them</li>
              <li>
                Playground demos:{" "}
                <a href="/playground/medium-paywall-example" className="underline underline-offset-2">
                  Medium Paywall
                </a>{" "}
                (scroll) and{" "}
                <a href="/playground/windows-xp" className="underline underline-offset-2">
                  Windows XP
                </a>{" "}
                (click)
              </li>
              <li>
                <a href="/docs" className="underline underline-offset-2">
                  Docs
                </a>{" "}
                with per-provider setup guides and a live configurator
              </li>
              <li>
                Published on npm as{" "}
                <a
                  href="https://www.npmjs.com/package/@remcostoeten/auth-drawer"
                  className="underline underline-offset-2"
                  target="_blank"
                  rel="noreferrer"
                >
                  @remcostoeten/auth-drawer
                </a>
              </li>
            </ul>

            <p className="pt-6 italic text-neutral-500">
              Thanks for reading. If this page convinced you, open the drawer, skim the docs, and
              wire your adapter once — then delete the old modal folder.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap gap-3" style={{ fontFamily: "system-ui, sans-serif" }}>
            {["React", "Authentication", "Product Design", "SaaS", "Developer Tools"].map((t) => (
              <span key={t} className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-700">
                {t}
              </span>
            ))}
          </div>

          <div
            className="mt-10 flex items-center justify-between border-y border-neutral-200 py-4"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            <div className="flex items-center gap-6 text-sm text-neutral-600">
              <button type="button" onClick={openAuth} className="flex items-center gap-1.5 hover:text-neutral-900">
                <Hand size={20} /> 2.8K
              </button>
              <button type="button" onClick={openAuth} className="flex items-center gap-1.5 hover:text-neutral-900">
                <MessageCircle size={20} /> 34
              </button>
            </div>
            <div className="flex items-center gap-5 text-neutral-600">
              <button type="button" onClick={openAuth} className="hover:text-neutral-900">
                <Bookmark size={20} />
              </button>
              <button type="button" onClick={openAuth} className="hover:text-neutral-900">
                <Share size={20} />
              </button>
              <button type="button" onClick={openAuth} className="hover:text-neutral-900">
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>

          <section className="mt-16 flex items-start gap-6" style={{ fontFamily: "system-ui, sans-serif" }}>
            <img src="/buu.svg" alt="" className="h-[88px] w-[88px] shrink-0 rounded-full object-cover" />
            <div className="flex-1">
              <div className="mb-1 text-sm text-neutral-500">Written by</div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xl font-semibold text-neutral-900">Remco Stoeten</div>
                <button
                  type="button"
                  onClick={openAuth}
                  className="rounded-full bg-neutral-900 px-4 py-1.5 text-sm text-white hover:bg-neutral-700"
                >
                  Follow
                </button>
              </div>
              <div className="mb-3 text-sm text-neutral-500">8.2K Followers · 142 Following</div>
              <p className="leading-relaxed text-neutral-700">
                Builds auth UI you do not have to rewrite for every provider. Auth Drawer is open
                source — docs, playground, and npm package linked from every serious integration
                path.
              </p>
            </div>
          </section>

          <section className="mt-16" style={{ fontFamily: "system-ui, sans-serif" }}>
            <h3 className="mb-6 text-2xl font-bold">Responses (34)</h3>
            <div className="mb-6 rounded-lg border border-neutral-200 p-4">
              <div className="mb-3 flex items-center gap-3">
                <img src="/buu.svg" alt="" className="h-8 w-8 rounded-full object-cover" />
                <span className="text-sm text-neutral-500">What are your thoughts?</span>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="px-3 py-1.5 text-sm text-neutral-500">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={openAuth}
                  className="rounded-full bg-green-700 px-3 py-1.5 text-sm text-white"
                >
                  Respond
                </button>
              </div>
            </div>

            {comments.map((c) => (
              <div key={c.name} className="border-b border-neutral-200 py-5">
                <div className="mb-2 flex items-center gap-3">
                  <img src="/buu.svg" alt="" className="h-8 w-8 rounded-full object-cover" />
                  <div>
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-neutral-500">{c.time}</div>
                  </div>
                </div>
                <p className="leading-relaxed text-neutral-800">{c.text}</p>
                <div className="mt-3 flex items-center gap-4 text-sm text-neutral-500">
                  <button type="button" onClick={openAuth} className="flex items-center gap-1 hover:text-neutral-900">
                    <Hand size={16} /> {c.claps}
                  </button>
                  <button type="button" onClick={openAuth} className="hover:text-neutral-900">
                    Reply
                  </button>
                </div>
              </div>
            ))}
          </section>

          <section className="mt-20" style={{ fontFamily: "system-ui, sans-serif" }}>
            <h3 className="mb-6 text-2xl font-bold">Try the other playground example</h3>
            <div className="grid gap-8 md:grid-cols-2">
              {moreArticles.map((p) => (
                <Link
                  key={p.title}
                  href={p.href}
                  className="group block cursor-pointer rounded-lg border border-transparent transition-colors hover:border-neutral-200"
                >
                  <div className="mb-2 text-xs text-neutral-500">
                    Remco Stoeten · in {p.publication}
                  </div>
                  <h4
                    className="mb-2 text-lg font-bold leading-snug group-hover:underline"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {p.title}
                  </h4>
                  <p className="mb-3 line-clamp-2 text-sm text-neutral-600">
                    Runnable demo from the Auth Drawer docs — open it to compare trigger styles
                    side by side.
                  </p>
                  <div className="text-xs text-neutral-500">
                    {p.date} · {p.read}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </article>

        <footer className="border-t border-neutral-200 py-10" style={{ fontFamily: "system-ui, sans-serif" }}>
          <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-x-6 gap-y-2 px-6 text-sm text-neutral-500">
            <a href="/docs">Docs</a>
            <a href="https://github.com/remcostoeten/auth-drawer" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href="https://www.npmjs.com/package/@remcostoeten/auth-drawer" target="_blank" rel="noreferrer">
              npm
            </a>
            <a href="/playground">Playground</a>
            <a href="/playground/windows-xp">Windows XP demo</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </footer>

        <AuthDrawer
          adapter={adapter}
          config={config}
          triggerStore={triggerStore}
          hideTrigger
          open={isDrawerOpen}
          onOpenChange={handleDrawerOpenChange}
          onSuccess={() => {
            succeededRef.current = true;
          }}
        />
      </div>
    </>
  );
}
