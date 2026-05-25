import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { formatCopy } from "../copy";
import type { ResolvedAuthOAuthCopy } from "../copy";
import type { LoadingAction, OAuthProvider, ProviderDef } from "../types";
import { AuthButton } from "./auth-button";
import { GithubIcon } from "./github-icon";
import { GoogleIcon } from "./google-icon";

type Props = {
  providers: OAuthProvider[];
  layout: "row" | "column";
  loadingAction: LoadingAction;
  isLoading: boolean;
  copy: ResolvedAuthOAuthCopy;
  onAction: (provider: OAuthProvider) => void;
};

const PROVIDER_ICONS = new Map<OAuthProvider, ProviderDef>([
  ["github", { id: "github", label: "GitHub", icon: GithubIcon }],
  ["google", { id: "google", label: "Google", icon: GoogleIcon }],
]);

/**
 * Renders configured OAuth provider buttons.
 *
 * @param props - Provider ids, layout, loading state, and action handler.
 * @returns OAuth button group.
 */
export function OauthButtons({
  providers,
  layout,
  loadingAction,
  isLoading,
  copy,
  onAction,
}: Props) {
  if (providers.length === 0) return null;

  return (
    <motion.div
      className={cn("mb-6", layout === "column" ? "flex flex-col gap-2" : "grid grid-cols-2 gap-3")}
      variants={{
        hidden: { opacity: 0, y: 5 },
        visible: { opacity: 1, y: 0 },
      }}
    >
      {providers.map((provider) => {
        const item = PROVIDER_ICONS.get(provider);
        if (!item) return null;

        const Icon = item.icon;
        const providerLabel = copy.providers[provider];
        const continueLabel = formatCopy(copy.continueWith, { provider: providerLabel });

        return (
          <AuthButton
            key={item.id}
            variant={item.id === "github" ? "primary" : "outline-solid"}
            icon={<Icon />}
            isLoading={loadingAction === item.id}
            disabled={isLoading}
            onClick={() => onAction(item.id)}
            ariaLabel={continueLabel}
            className={layout === "row" ? "gap-2 px-3" : undefined}
          >
            <span className="whitespace-nowrap">
              {layout === "row" ? providerLabel : continueLabel}
            </span>
          </AuthButton>
        );
      })}
    </motion.div>
  );
}
