import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";

type CodeBlockProps = {
    children: string;
    lang?: string;
};

export function CodeBlock({ children, lang = "tsx" }: CodeBlockProps) {
    const [html, setHtml] = useState<string>("");

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
            <pre className="custom-scrollbar overflow-x-auto border border-foreground/10 bg-[#0b0b0c] p-4 text-[0.7rem] leading-6 text-white/78">
                <code className="font-mono">{children}</code>
            </pre>
        );
    }

    return (
        <div
            className="custom-scrollbar overflow-x-auto border border-foreground/10 bg-[#0b0b0c] p-4 font-mono text-[0.7rem] leading-6 [&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!p-0"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
