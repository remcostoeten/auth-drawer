import { motion } from "framer-motion";
import type { AuthFooterSegment } from "../copy";

const FADE_VIEW = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] as const },
  },
};

type Props = {
  segments: AuthFooterSegment[];
};

export function AuthFooter({ segments }: Props) {
  if (segments.length === 0) return null;

  return (
    <motion.p
      className="mx-auto mt-5 max-w-sm text-center text-[0.6875rem] leading-relaxed text-overlay-subtle"
      variants={FADE_VIEW}
    >
      {segments.map((segment, index) => {
        if (segment.type === "link") {
          return (
            <a
              key={`${segment.type}-${index}`}
              href={segment.href}
              target={segment.target}
              rel={segment.target === "_blank" ? "noreferrer noopener" : undefined}
              className="underline transition-colors hover:text-overlay-muted"
            >
              {segment.label}
            </a>
          );
        }

        return <span key={`${segment.type}-${index}`}>{segment.value}</span>;
      })}
    </motion.p>
  );
}
