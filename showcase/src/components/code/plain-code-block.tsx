import { CopyButton } from "./copy-button";

type Props = {
    children: string;
};

export function PlainCodeBlock({ children }: Props) {
    return (
        <div className="relative group">
            <pre className="custom-scrollbar overflow-x-auto border border-foreground/10 bg-[#0b0b0c] p-4 text-[0.7rem] leading-6 text-white/78">
                <code className="font-mono">{children}</code>
            </pre>
            <CopyButton text={children} />
        </div>
    );
}
