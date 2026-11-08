import { For, Show, createSignal } from "solid-js";
import { formatCopy } from "@remcostoeten/auth-drawer/core";
import type { ResolvedAuthOAuthCopy } from "@remcostoeten/auth-drawer/core";
import { ChevronDownIcon } from "../icons/ui-icons";
import { cn } from "../lib/cn";
import {
  resolveOAuthProviders,
  resolveOAuthVisibleCount,
  type OAuthProvider,
} from "../oauth-providers";
import type { LoadingAction, ProviderDef } from "../types";
import { AuthButton, type ButtonFeedback } from "./auth-button";
import { Collapse } from "./collapse";

type Layout = "row" | "column";

type Props = {
  providers: OAuthProvider[];
  layout: Layout;
  visibleCount?: number;
  showPreviewIcons?: boolean;
  loadingAction: LoadingAction;
  isLoading: boolean;
  copy: ResolvedAuthOAuthCopy;
  onAction: (provider: OAuthProvider) => void;
  successProvider?: OAuthProvider | null;
  successMessage?: string;
  lastUsedProvider?: OAuthProvider | null;
  lastUsedLabel?: string;
};

type ListProps = Omit<Props, "providers" | "visibleCount" | "showPreviewIcons"> & {
  providers: OAuthProvider[];
  primaryProvider?: OAuthProvider;
};

function providerGridClass(layout: Layout) {
  return layout === "column" ? "flex flex-col gap-2" : "grid grid-cols-2 gap-3";
}

function ProviderButton(props: Omit<ListProps, "providers"> & { provider: OAuthProvider }) {
  const item = resolveOAuthProviders([props.provider])[0];
  if (!item) return null;

  const Icon = item.icon;
  const providerLabel = () => props.copy.providers[props.provider];
  const continueLabel = () => formatCopy(props.copy.continueWith, { provider: providerLabel() });
  const feedback = (): ButtonFeedback | undefined =>
    props.successProvider === item.id
      ? { status: "success", message: props.successMessage ?? "Signed in" }
      : undefined;

  return (
    <AuthButton
      variant={props.provider === (props.primaryProvider ?? "github") ? "primary" : "outline-solid"}
      icon={<Icon />}
      isLoading={props.loadingAction === item.id}
      disabled={props.isLoading}
      onClick={() => props.onAction(item.id)}
      ariaLabel={continueLabel()}
      class={props.layout === "row" ? "gap-2 px-3" : undefined}
      feedback={feedback()}
      badge={props.lastUsedProvider === item.id ? props.lastUsedLabel : undefined}
    >
      <span class="whitespace-nowrap">
        {props.layout === "row" ? providerLabel() : continueLabel()}
      </span>
    </AuthButton>
  );
}

function ProviderList(props: ListProps) {
  return (
    <For each={props.providers}>
      {(provider) => <ProviderButton {...props} provider={provider} />}
    </For>
  );
}

function OverflowProviderChip(props: { item: ProviderDef }) {
  const Icon = props.item.icon;

  return (
    <span
      class="flex h-8 w-8 shrink-0 items-center justify-center border border-overlay-border/20 bg-overlay-surface/55 text-overlay-text shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] [&_svg]:h-4 [&_svg]:w-4"
      aria-hidden="true"
    >
      <Icon />
    </span>
  );
}

type ToggleProps = {
  expanded: boolean;
  overflow: ProviderDef[];
  showLabel: string;
  hideLabel: string;
  showPreviewIcons: boolean;
  onToggle: () => void;
};

function OAuthOverflowToggle(props: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => props.onToggle()}
      aria-expanded={props.expanded}
      class="mt-3 flex w-full items-center justify-center gap-2.5 border-0 bg-transparent py-2 text-[0.7rem] leading-none text-overlay-muted transition-colors hover:text-overlay-text focus-visible:outline-hidden focus-visible:text-overlay-focus"
    >
      <Show when={props.showPreviewIcons && !props.expanded && props.overflow.length > 0}>
        <span class="flex items-center gap-1.5">
          <For each={props.overflow}>{(item) => <OverflowProviderChip item={item} />}</For>
        </span>
      </Show>
      <span class="tracking-[0.02em]">{props.expanded ? props.hideLabel : props.showLabel}</span>
      <ChevronDownIcon
        size={14}
        class={cn(
          "size-3.5 shrink-0 opacity-55 transition-transform duration-200",
          props.expanded && "rotate-180",
        )}
      />
    </button>
  );
}

export function OauthButtons(props: Props) {
  const [showAll, setShowAll] = createSignal(false);
  const registered = () => resolveOAuthProviders(props.providers);
  const providerIds = () => registered().map((item) => item.id);
  const visibleCount = () => resolveOAuthVisibleCount(props.visibleCount);
  const visibleIds = () => providerIds().slice(0, visibleCount());
  const overflowIds = () => providerIds().slice(visibleCount());
  const primaryProvider = () => (providerIds().includes("github") ? "github" : providerIds()[0]);

  return (
    <Show when={registered().length > 0}>
      <div class="auth-rise mb-6" style={{ "--auth-i": 1 }}>
        <div class={providerGridClass(props.layout)}>
          <ProviderList
            {...props}
            providers={visibleIds()}
            primaryProvider={primaryProvider()}
          />
        </div>

        <Show when={overflowIds().length > 0}>
          <OAuthOverflowToggle
            expanded={showAll()}
            overflow={resolveOAuthProviders(overflowIds())}
            showLabel={props.copy.showAllSocial}
            hideLabel={props.copy.hideAllSocial}
            showPreviewIcons={props.showPreviewIcons ?? true}
            onToggle={() => setShowAll((open) => !open)}
          />

          <Collapse open={showAll()}>
            <div class={cn("pt-3", providerGridClass(props.layout))}>
              <ProviderList {...props} providers={overflowIds()} />
            </div>
          </Collapse>
        </Show>
      </div>
    </Show>
  );
}
