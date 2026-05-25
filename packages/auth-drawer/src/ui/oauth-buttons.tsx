import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";
import { formatCopy } from "../copy";
import type { ResolvedAuthOAuthCopy } from "../copy";
import {
  resolveOAuthProviders,
  resolveOAuthVisibleCount,
  type OAuthProvider,
} from "../oauth-providers";
import type { LoadingAction, ProviderDef } from "../types";
import { AuthButton } from "./auth-button";

type Props = {
  providers: OAuthProvider[];
  layout: "row" | "column";
  visibleCount?: number;
  showPreviewIcons?: boolean;
  loadingAction: LoadingAction;
  isLoading: boolean;
  copy: ResolvedAuthOAuthCopy;
  onAction: (provider: OAuthProvider) => void;
};

const LIST_VARIANTS = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0 },
};

function providerGridClass(layout: "row" | "column") {
  return layout === "column" ? "flex flex-col gap-2" : "grid grid-cols-2 gap-3";
}

type ProviderButtonProps = {
  provider: OAuthProvider;
  layout: "row" | "column";
  loadingAction: LoadingAction;
  isLoading: boolean;
  copy: ResolvedAuthOAuthCopy;
  onAction: (provider: OAuthProvider) => void;
  variant: "primary" | "outline-solid";
};

function ProviderButton({
  provider,
  layout,
  loadingAction,
  isLoading,
  copy,
  onAction,
  variant,
}: ProviderButtonProps) {
  const items = resolveOAuthProviders([provider]);
  const item = items[0];
  if (!item) return null;

  const Icon = item.icon;
  const providerLabel = copy.providers[provider];
  const continueLabel = formatCopy(copy.continueWith, { provider: providerLabel });

  return (
    <AuthButton
      key={item.id}
      variant={variant}
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
}

type ProviderListProps = Omit<ProviderButtonProps, "provider" | "variant"> & {
  providers: OAuthProvider[];
  primaryProvider?: OAuthProvider;
};

function ProviderList({
  providers,
  layout,
  loadingAction,
  isLoading,
  copy,
  onAction,
  primaryProvider = "github",
}: ProviderListProps) {
  return (
    <>
      {providers.map((provider) => (
        <ProviderButton
          key={provider}
          provider={provider}
          layout={layout}
          loadingAction={loadingAction}
          isLoading={isLoading}
          copy={copy}
          onAction={onAction}
          variant={provider === primaryProvider ? "primary" : "outline-solid"}
        />
      ))}
    </>
  );
}

function OverflowProviderChip({ item }: { item: ProviderDef }) {
  const Icon = item.icon;

  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center border border-overlay-border/20 bg-overlay-surface/55 text-overlay-text shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] [&_svg]:h-4 [&_svg]:w-4"
      aria-hidden="true"
    >
      <Icon />
    </span>
  );
}

type OverflowToggleProps = {
  expanded: boolean;
  overflow: ProviderDef[];
  showLabel: string;
  hideLabel: string;
  showPreviewIcons: boolean;
  onToggle: () => void;
};

function OAuthOverflowToggle({
  expanded,
  overflow,
  showLabel,
  hideLabel,
  showPreviewIcons,
  onToggle,
}: OverflowToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="mt-3 flex w-full items-center justify-center gap-2.5 border-0 bg-transparent py-2 text-[0.7rem] leading-none text-overlay-muted transition-colors hover:text-overlay-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-overlay-border/35"
    >
      {showPreviewIcons && !expanded && overflow.length > 0 ? (
        <span className="flex items-center gap-1.5">
          {overflow.map((item) => (
            <OverflowProviderChip key={item.id} item={item} />
          ))}
        </span>
      ) : null}
      <span className="tracking-[0.02em]">{expanded ? hideLabel : showLabel}</span>
      <ChevronDown
        className={cn(
          "size-3.5 shrink-0 opacity-55 transition-transform duration-200",
          expanded && "rotate-180",
        )}
        aria-hidden="true"
      />
    </button>
  );
}

/**
 * Renders configured OAuth provider buttons.
 * When more providers are enabled than `visibleCount`, the first N in the array
 * stay visible and the rest sit behind a collapsible disclosure toggle.
 *
 * @param props - Provider ids, layout, overflow settings, loading state, and action handler.
 * @returns OAuth button group.
 */
export function OauthButtons({
  providers,
  layout,
  visibleCount,
  showPreviewIcons = true,
  loadingAction,
  isLoading,
  copy,
  onAction,
}: Props) {
  const [showAll, setShowAll] = useState(false);
  const registered = resolveOAuthProviders(providers);
  const resolvedVisibleCount = resolveOAuthVisibleCount(visibleCount);

  if (registered.length === 0) return null;

  const providerIds = registered.map((item) => item.id);
  const hasOverflow = providerIds.length > resolvedVisibleCount;
  const visibleIds = providerIds.slice(0, resolvedVisibleCount);
  const overflowIds = providerIds.slice(resolvedVisibleCount);
  const overflowItems = resolveOAuthProviders(overflowIds);
  const primaryProvider = providerIds.includes("github") ? "github" : providerIds[0];

  return (
    <motion.div
      className="mb-6"
      variants={LIST_VARIANTS}
    >
      <div className={providerGridClass(layout)}>
        <ProviderList
          providers={visibleIds}
          layout={layout}
          loadingAction={loadingAction}
          isLoading={isLoading}
          copy={copy}
          onAction={onAction}
          primaryProvider={primaryProvider}
        />
      </div>

      {hasOverflow ? (
        <>
          <OAuthOverflowToggle
            expanded={showAll}
            overflow={overflowItems}
            showLabel={copy.showAllSocial}
            hideLabel={copy.hideAllSocial}
            showPreviewIcons={showPreviewIcons}
            onToggle={() => setShowAll((open) => !open)}
          />

          <AnimatePresence initial={false}>
            {showAll ? (
              <motion.div
                key="oauth-overflow"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className={cn("pt-3", providerGridClass(layout))}>
                  <ProviderList
                    providers={overflowIds}
                    layout={layout}
                    loadingAction={loadingAction}
                    isLoading={isLoading}
                    copy={copy}
                    onAction={onAction}
                  />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </>
      ) : null}
    </motion.div>
  );
}
