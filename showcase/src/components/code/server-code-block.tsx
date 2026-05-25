import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";
import { CopyButton } from "./copy-button";

type CodeBlockProps = {
    children: string;
    lang?: string;
    embedded?: boolean;
};

const shellClassName =
    "custom-scrollbar overflow-x-auto bg-[#0b0b0c] p-4 text-[0.7rem] leading-6 text-white/78";
const framedClassName = `${shellClassName} border border-foreground/10`;
const embeddedClassName = `${shellClassName} border-0`;

export function CodeBlock({ children, lang = "tsx", embedded = false }: CodeBlockProps) {
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
                <pre className={containerClassName}>
                    <code className="font-mono">{children}</code>
                </pre>
                <CopyButton text={children} />
            </div>
        );
    }

    return (
        <div className="relative group">
            <div
                className={`${containerClassName} font-mono [&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!p-0`}
                dangerouslySetInnerHTML={{ __html: html }}
            />
            <CopyButton text={children} />
        </div>
    );
}
