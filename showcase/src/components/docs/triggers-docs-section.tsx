import type { ReactNode } from "react";
import { CodeBlock } from "../code/server-code-block";

const PAGE_LOAD_SNIPPET = `const triggerStore = createAuthTriggerStore();
const authAdapter = createYourAuthAdapter();

const config: AuthConfig = {
  triggers: {
    pageLoad: {
      delayMs: 1200,
      once: true,
      scope: "day",
    },
  },
};

<AuthDrawer adapter={authAdapter} config={config} triggerStore={triggerStore} />`;

const CLICK_SNIPPET = `const triggerStore = createAuthTriggerStore();
const authAdapter = createYourAuthAdapter();

const config: AuthConfig = {
  triggers: {
    click: {
      selector: "[data-auth-trigger='sign-in']",
      once: true,
    },
  },
};

<button type="button" data-auth-trigger="sign-in">
  Sign in
</button>

<AuthDrawer adapter={authAdapter} config={config} triggerStore={triggerStore} hideTrigger />`;

const SCROLL_SNIPPET = `const triggerStore = createAuthTriggerStore();
const authAdapter = createYourAuthAdapter();
const articleRef = useRef<HTMLDivElement>(null);

const config: AuthConfig = {
  triggers: {
    scrollOpen: {
      threshold: 0.25,
      once: true,
      cooldownMs: 30_000,
    },
  },
};

useScrollOpenTrigger({
  containerRef: articleRef,
  threshold: config.triggers?.scrollOpen?.threshold ?? 0.25,
  once: config.triggers?.scrollOpen?.once ?? true,
  enabled: Boolean(config.triggers?.scrollOpen),
  onTrigger: (progress) => {
    triggerStore.emit({
      kind: "scrollOpen",
      progress,
      threshold: config.triggers?.scrollOpen?.threshold,
      container: "self",
    });
  },
});

<AuthDrawer adapter={authAdapter} config={config} triggerStore={triggerStore} hideTrigger />`;

const STATE_SNIPPET = `const triggerStore = createAuthTriggerStore();
const authAdapter = createYourAuthAdapter();

const config: AuthConfig = {
  triggers: {
    state: {
      state: "expired",
      once: true,
    },
  },
};

async function fetchProtectedResource() {
  const response = await fetch("/api/me");

  if (response.status === 401) {
    triggerStore.emit({
      kind: "state",
      state: "expired",
      reason: "session-expired",
    });
  }
}

<AuthDrawer adapter={authAdapter} config={config} triggerStore={triggerStore} hideTrigger />`;

const IDLE_SNIPPET = `const triggerStore = createAuthTriggerStore();
const authAdapter = createYourAuthAdapter();

const config: AuthConfig = {
  triggers: {
    idle: {
      idleMs: 60_000,
      once: true,
      scope: "session",
    },
  },
};

function onIdleDetected(idleMs: number) {
  triggerStore.emit({
    kind: "idle",
    idleMs,
  });
}

<AuthDrawer adapter={authAdapter} config={config} triggerStore={triggerStore} hideTrigger />`;

const CUSTOM_SNIPPET = `const triggerStore = createAuthTriggerStore();
const authAdapter = createYourAuthAdapter();

const config: AuthConfig = {
  triggers: {
    custom: {
      event: "paywall:blocked",
      once: true,
      scope: "session",
    },
  },
};

function onCanvasBlockerHit() {
  triggerStore.emit({
    kind: "custom",
    event: "paywall:blocked",
    payload: { layer: "comments" },
  });
}

<AuthDrawer adapter={authAdapter} config={config} triggerStore={triggerStore} hideTrigger />`;

type TriggerExampleCardProps = {
  title: ReactNode;
  description: ReactNode;
  snippet: string;
};

function TriggerTitle({ label, configKey }: { label: string; configKey: string }) {
  return (
    <>
      {label}{" "}
      <code className="font-mono text-[0.68rem] font-normal text-foreground/45">
        {configKey}
      </code>
    </>
  );
}

function TriggerExampleCard({
  title,
  description,
  snippet,
}: TriggerExampleCardProps) {
  return (
    <article className="overflow-hidden rounded-[8px] border border-foreground/10 bg-foreground/[0.02]">
      <div className="border-b border-foreground/10 px-4 py-3.5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="mt-1 max-w-xl text-sm leading-6 text-foreground/58">
          {description}
        </div>
      </div>
      <div className="bg-[#0b0b0c]/40 px-1 pb-1 pt-0">
        <CodeBlock lang="tsx" embedded title="trigger example">
          {snippet}
        </CodeBlock>
      </div>
    </article>
  );
}

export function TriggersDocsSection() {
  return (
    <>
      <p className="max-w-2xl text-sm leading-6 text-foreground/58">
        Use <code className="font-mono text-[0.72rem]">config.triggers</code> to
        declare when the auth surface should open. Each rule registers with a
        shared{" "}
        <code className="font-mono text-[0.72rem]">AuthTriggerStore</code> that
        applies cooldown, once, scope, sampling, and every-N policy before
        opening the drawer.
      </p>

      <div className="mt-5 max-w-2xl rounded-[8px] border border-foreground/10 bg-foreground/[0.02] px-4 py-3.5 text-sm leading-6 text-foreground/58">
        <p className="font-semibold text-foreground/78">
          Built-in vs emit-only
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong className="font-semibold text-foreground/72">
              pageLoad
            </strong>{" "}
            and{" "}
            <strong className="font-semibold text-foreground/72">click</strong>{" "}
            — AuthDrawer emits events when configured (click requires{" "}
            <code className="font-mono text-[0.72rem]">selector</code>).
          </li>
          <li>
            <strong className="font-semibold text-foreground/72">
              scrollOpen
            </strong>
            ,{" "}
            <strong className="font-semibold text-foreground/72">state</strong>,{" "}
            <strong className="font-semibold text-foreground/72">idle</strong>,
            and{" "}
            <strong className="font-semibold text-foreground/72">custom</strong>{" "}
            — your app emits matching events via{" "}
            <code className="font-mono text-[0.72rem]">
              triggerStore.emit()
            </code>
            .
          </li>
        </ul>
      </div>

      <div className="mt-8 space-y-5">
        <TriggerExampleCard
          title={<TriggerTitle label="Page load" configKey="pageLoad" />}
          description={
            <>
              Open after a delay on mount. Useful for onboarding prompts or
              returning visitors. Policy keys like{" "}
              <code className="font-mono text-[0.72rem]">
                scope: &quot;day&quot;
              </code>{" "}
              persist eligibility in localStorage. This is useful when you want
              to achieve a SaaS-like landing welcome prior to users having to
              authenticate.
            </>
          }
          snippet={PAGE_LOAD_SNIPPET}
        />

        <TriggerExampleCard
          title={<TriggerTitle label="Click" configKey="click" />}
          description={
            <>
              Open when the user clicks a matching selector. AuthDrawer binds
              document listeners when{" "}
              <code className="font-mono text-[0.72rem]">selector</code> is set.
              This is useful when you want to achieve a Windows-like explicit
              sign-in CTA prior to users having to authenticate.
            </>
          }
          snippet={CLICK_SNIPPET}
        />

        <TriggerExampleCard
          title={
            <TriggerTitle label="Scroll threshold" configKey="scrollOpen" />
          }
          description={
            <>
              Paywall-style flows: observe a scroll container with{" "}
              <code className="font-mono text-[0.72rem]">
                useScrollOpenTrigger
              </code>
              , then emit into the store so shared policy applies. The debug lab
              Medium scene uses this pattern. This is useful when you want to
              achieve a Medium-like tiny preview prior to users having to
              authenticate.
            </>
          }
          snippet={SCROLL_SNIPPET}
        />

        <TriggerExampleCard
          title={<TriggerTitle label="Auth state" configKey="state" />}
          description={
            <>
              Open when session checks fail. Emit{" "}
              <code className="font-mono text-[0.72rem]">denied</code>,{" "}
              <code className="font-mono text-[0.72rem]">expired</code>, or{" "}
              <code className="font-mono text-[0.72rem]">missing</code> from API
              clients, middleware, or route guards.
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  <code className="font-mono text-[0.72rem]">denied</code> —
                  This is useful when you want to achieve a SaaS-like feature
                  gate when users need to authenticate to continue.
                </li>
                <li>
                  <code className="font-mono text-[0.72rem]">expired</code> —
                  This is useful when you want to achieve a dashboard-like
                  session refresh when users need to authenticate to continue.
                </li>
                <li>
                  <code className="font-mono text-[0.72rem]">missing</code> —
                  This is useful when you want to achieve a checkout-like
                  sign-in wall when users need to authenticate to continue.
                </li>
              </ul>
            </>
          }
          snippet={STATE_SNIPPET}
        />

        <TriggerExampleCard
          title={<TriggerTitle label="Idle" configKey="idle" />}
          description={
            <>
              Open after inactivity. Your app emits{" "}
              <code className="font-mono text-[0.72rem]">idle</code> events when
              the user crosses{" "}
              <code className="font-mono text-[0.72rem]">idleMs</code> without
              interaction. This is useful when you want to achieve a SaaS-like
              re-engagement prompt when users need to authenticate to continue.
            </>
          }
          snippet={IDLE_SNIPPET}
        />

        <TriggerExampleCard
          title={<TriggerTitle label="Custom events" configKey="custom" />}
          description={
            <>
              Name your own trigger channel for canvas blockers, router hooks,
              or third-party widgets. The store matches on{" "}
              <code className="font-mono text-[0.72rem]">event</code> string
              equality. This is useful when you want to achieve a canvas-like
              interaction blocker prior to users having to authenticate.
            </>
          }
          snippet={CUSTOM_SNIPPET}
        />
      </div>

      <p className="mt-6 text-sm text-foreground/50">
        Full prop reference:{" "}
        <a
          href="#api-triggers"
          className="text-foreground/72 underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Triggers API
        </a>
        .
      </p>
    </>
  );
}
