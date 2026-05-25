import { useRef } from "react";
import { Edit3, Search, Smartphone, Sparkles } from "lucide-react";
import { useScrollOpenTrigger } from "@remcostoeten/auth-drawer";
import type {
  AuthTriggerConfig,
  AuthTriggerStore,
} from "../../../../../../packages/auth-drawer/src/types";

type Props = {
  onOpenAuth: () => void;
  triggers?: AuthTriggerConfig;
  triggerStore?: AuthTriggerStore;
};

const articleParagraphs = [
  "If you asked me about AI a year ago, I would have told you it is all hype. Can't do anything real. Yeah, that was naive. But, in my defense, I did play with LLMs and the results were... uninspiring. Tried writing code and it always failed.",
  "Tested how well it could write stories and it flopped. So bad, but things have changed. First, LLMs and tooling around them got way better. Second, I learned how to effectively use LLMs and using LLMs effectively is a skill we all need in 2026.",
  "All of it sucked for me, but guess what. As usual, the tool wasn't the problem. I was. Or more specifically, my skill with the tool was the problem.",
  "Now, we should be clear. This isn't The Ultimate Guide to Claude Code and I will not 10X Your LLM Productivity in Three Easy Steps. If I ever write titles like that, you may have my keyboard.",
];

const highlights = [
  { label: "Reading time", value: "11 min" },
  { label: "Responses", value: "112" },
  { label: "Claps", value: "3.7K" },
];

const relatedNotes = [
  {
    title: "Designing the right interruption",
    body: "The auth drawer should feel like the product making a decision, not an overlay someone left behind.",
  },
  {
    title: "Smooth before sudden",
    body: "The page can stay editorial and calm until the scroll threshold fires the drawer unexpectedly.",
  },
  {
    title: "Keep the body readable",
    body: "The article still needs enough vertical rhythm to feel like a real clone, not a single locked card.",
  },
] as const;

function MediumHeader({ onOpenAuth }: Props) {
  return (
    <header className="medium-topbar">
      <div className="medium-brand">
        <div className="medium-logo">Medium</div>
        <div className="medium-brand__sub">Read. Write. Subscribe.</div>
      </div>

      <label className="medium-search" aria-label="Search">
        <Search size={18} aria-hidden="true" />
        <span>Search stories, topics, and authors</span>
      </label>

      <div className="medium-topbar__actions">
        <button type="button" className="medium-topbar__link">
          <Smartphone size={16} aria-hidden="true" />
          Get app
        </button>
        <button type="button" className="medium-topbar__link">
          <Edit3 size={16} aria-hidden="true" />
          Write
        </button>
        <button type="button" className="medium-topbar__signin" onClick={onOpenAuth}>
          Sign in
        </button>
        <button type="button" className="medium-topbar__signup" onClick={onOpenAuth}>
          Start reading
        </button>
      </div>
    </header>
  );
}

export function MediumPaywallScene({ onOpenAuth, triggers, triggerStore }: Props) {
  const sceneRef = useRef<HTMLDivElement>(null);

  useScrollOpenTrigger({
    containerRef: sceneRef,
    onTrigger: (progress) => {
      if (triggerStore) {
        triggerStore.emit({
          kind: "scrollOpen",
          progress,
          threshold: triggers?.scrollOpen?.threshold ?? 0.25,
          container: triggers?.scrollOpen?.container ?? "self",
        });
        return;
      }

      onOpenAuth();
    },
    threshold: triggers?.scrollOpen?.threshold ?? 0.25,
    once: triggers?.scrollOpen?.once ?? true,
    enabled: Boolean(triggers?.scrollOpen),
  });

  return (
    <div ref={sceneRef} className="medium-scene">
      <div className="medium-backdrop" aria-hidden="true" />
      <MediumHeader onOpenAuth={onOpenAuth} />

      <main className="medium-shell">
        <section className="medium-article">
          <div className="medium-badge">
            <Sparkles size={15} className="medium-badge__spark" aria-hidden="true" />
            Member-only story
          </div>

          <h1 className="medium-title">This component is awesome</h1>
          <p className="medium-subtitle">And so are these examples</p>

          <div className="medium-author">
            <span className="medium-author__photo" aria-hidden="true" />
            <div className="medium-author__copy">
              <div className="medium-author__name-row">
                <span className="medium-author__name">Remco Stoeten</span>
                <button type="button" className="medium-follow">
                  Follow
                </button>
              </div>
              <div className="medium-author__meta">
                <span>Mar 2, 2026</span>
                <span>11 min read</span>
              </div>
            </div>
          </div>

          <div className="medium-stats">
            {highlights.map((item) => (
              <div key={item.label} className="medium-stat">
                <span className="medium-stat__label">{item.label}</span>
                <span className="medium-stat__value">{item.value}</span>
              </div>
            ))}
          </div>

          <article className="medium-body">
            <div className="medium-fade">
              <p>{articleParagraphs[0]}</p>
              <p>
                Tested how well it could write stories and it flopped. So bad, but things have
                changed. First, LLMs and tooling around them got way better. Second,{" "}
                <span className="medium-highlight">
                  I learned how to effectively use LLMs and using LLMs effectively is a skill we
                  all need in 2026.
                </span>
              </p>
              {articleParagraphs.slice(2).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="medium-inline-callout">
              <div>
                <div className="medium-inline-callout__label">Keep scrolling</div>
                <div className="medium-inline-callout__copy">
                  Once the article crosses 25% of the scroll range, the auth drawer opens
                  immediately.
                </div>
              </div>
              <button type="button" className="medium-inline-callout__button" onClick={onOpenAuth}>
                Open now
              </button>
            </div>

            <div className="medium-notes">
              {relatedNotes.map((note) => (
                <article key={note.title} className="medium-note">
                  <div className="medium-note__kicker">Editorial note</div>
                  <h2>{note.title}</h2>
                  <p>{note.body}</p>
                </article>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
