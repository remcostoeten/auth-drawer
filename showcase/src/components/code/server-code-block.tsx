import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";
import { CopyButton } from "./copy-button";

type Props = {
  children: string;
  lang?: string;
  embedded?: boolean;
  title?: string;
};

const shellClassName =
  "custom-scrollbar overflow-x-auto bg-[#0b0b0c] p-4 text-[0.7rem] leading-6 text-white/78";
const framedClassName = `${shellClassName} border border-foreground/10`;
const embeddedClassName = `${shellClassName} border-0`;

export function CodeBlock({
  children,
  lang = "tsx",
  embedded = false,
  title,
}: Props) {
  const [html, setHtml] = useState<string>("");
  const containerClassName = embedded ? embeddedClassName : framedClassName;

  useEffect(() => {
    let cancelled = false;

    codeToHtml(children, { lang, theme: "github-dark" }).then((result) => {
      if (!cancelled) setHtml(result);
    });

    return () => {
      cancelled = true;
    };
  }, [children, lang]);

  if (!html) {
    return (
      <div className="relative group">
        {title ? (
          <div className="flex items-center justify-between border border-b-0 border-foreground/10 bg-[#0b0b0c] px-3 py-2">
            <span className="font-mono text-[0.68rem] text-white/56">
              {title}
            </span>
          </div>
        ) : null}
        <pre className={containerClassName}>
          <code className="font-mono">{children}</code>
        </pre>
        <CopyButton text={children} />
      </div>
    );
  }

  return (
    <div className="relative group">
      {title ? (
        <div className="flex items-center justify-between border border-b-0 border-foreground/10 bg-[#0b0b0c] px-3 py-2">
          <span className="font-mono text-[0.68rem] text-white/56">
            {title}
          </span>
        </div>
      ) : null}
      <div
        className={`${containerClassName} font-mono [&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!p-0`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <CopyButton text={children} />
    </div>
  );
}
