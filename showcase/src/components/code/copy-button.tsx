import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy } from "lucide-react";

type CopyButtonProps = {
    text: string;
};

export function CopyButton({ text }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.button
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className="absolute top-2.5 right-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-white/35 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-white/10 hover:text-white/70"
            aria-label={copied ? "Copied" : "Copy code"}
        >
            <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                    <motion.span
                        key="check"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                        <Check size={14} />
                    </motion.span>
                ) : (
                    <motion.span
                        key="copy"
                        initial={{ scale: 0, rotate: 90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: -90 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                        <Copy size={14} />
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    );
}
