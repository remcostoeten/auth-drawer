import { Github } from "lucide-react";
import {
  OAUTH_PROVIDER_IDS,
  defaultLabelForOAuthProvider,
  resolveOAuthVisibleCount,
} from "@/components/auth/auth-drawer";
import { useConfigurator } from "../context";
import { arraysEqual, CONFIGURATOR_DEFAULTS } from "../helpers";
import { EditedDot } from "../../ui/edited-dot";
import { NumberField, SelectField } from "../../ui/fields";
import {
  CheckboxRow,
  SettingGroup,
  SettingGroupHeader,
  SwitchRow,
} from "../../ui/setting-group";

export function AuthConfiguratorTab() {
  const {
    mode,
    setMode,
    auth,
    setAuth,
    motion,
    updateAuth,
    updateMotion,
    cycleProvider,
    updateOAuthOverflow,
    oauthVisibleCount,
    providerCount,
    hasOAuthOverflow,
  } = useConfigurator();
  return (
  <div className="space-y-3">
    <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
      <h3 className="docs-label mb-3 text-[0.66rem] font-normal uppercase text-foreground/42">
        Presentation
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <SelectField
          label="Surface"
          value={mode}
          onChange={setMode}
          options={[
            { value: "drawer", label: "Drawer" },
            { value: "modal", label: "Modal" },
          ]}
          isEdited={mode !== CONFIGURATOR_DEFAULTS.presentation.variant}
          onReset={() =>
            setMode(CONFIGURATOR_DEFAULTS.presentation.variant)
          }
        />
        <label className="block">
          <span className="mb-2 flex items-center text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-foreground/42">
            {motion.desktopWidth !==
            CONFIGURATOR_DEFAULTS.motion.desktopWidth ? (
              <EditedDot
                onReset={() =>
                  updateMotion(
                    "desktopWidth",
                    CONFIGURATOR_DEFAULTS.motion.desktopWidth,
                  )
                }
              />
            ) : null}
            Width
          </span>
          <input
            type="text"
            value={motion.desktopWidth}
            onChange={(e) =>
              updateMotion("desktopWidth", e.target.value)
            }
            className="h-10 w-full rounded-[5px] border border-foreground/10 bg-[#0f0f10] px-3 text-xs font-semibold text-foreground outline-hidden transition-colors hover:border-foreground/20 focus:border-foreground/35 focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:outline-hidden dark:bg-[#0f0f10]"
          />
        </label>
      </div>
    </div>

    <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
      <h3 className="docs-label mb-3 text-[0.66rem] font-normal uppercase text-foreground/42">
        ui.auth
      </h3>
      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <SelectField
          label="OAuth layout"
          value={auth.oauthLayout ?? "column"}
          onChange={(v) => updateAuth("oauthLayout", v)}
          options={[
            { value: "column", label: "Column" },
            { value: "row", label: "Row" },
          ]}
          isEdited={
            (auth.oauthLayout ?? "column") !==
            CONFIGURATOR_DEFAULTS.auth.oauthLayout
          }
          onReset={() =>
            updateAuth(
              "oauthLayout",
              CONFIGURATOR_DEFAULTS.auth.oauthLayout,
            )
          }
        />
        <SelectField
          label="Initial mode"
          value={auth.initialMode ?? "login"}
          onChange={(v) => updateAuth("initialMode", v)}
          options={[
            { value: "login", label: "Login" },
            { value: "register", label: "Register" },
          ]}
          isEdited={
            (auth.initialMode ?? "login") !==
            CONFIGURATOR_DEFAULTS.auth.initialMode
          }
          onReset={() =>
            updateAuth(
              "initialMode",
              CONFIGURATOR_DEFAULTS.auth.initialMode,
            )
          }
        />
      </div>

      <div className="mb-5">
        <SettingGroupHeader
          title="Providers"
          hint="Check to enable. # is display order in the drawer."
          isEdited={
            !arraysEqual(
              auth.providers ?? [],
              CONFIGURATOR_DEFAULTS.auth.providers,
            )
          }
          onReset={() =>
            setAuth((prev) => ({
              ...prev,
              providers: [...CONFIGURATOR_DEFAULTS.auth.providers],
            }))
          }
        />
        <SettingGroup>
          {OAUTH_PROVIDER_IDS.map((provider) => {
            const activeProviders = auth.providers ?? [];
            const orderIndex = activeProviders.indexOf(provider);

            return (
              <CheckboxRow
                key={provider}
                label={
                  <span className="inline-flex items-center gap-2">
                    {provider === "github" ? (
                      <Github
                        size={14}
                        className="text-foreground/55"
                        aria-hidden="true"
                      />
                    ) : null}
                    {defaultLabelForOAuthProvider(provider)}
                  </span>
                }
                checked={orderIndex !== -1}
                order={
                  orderIndex === -1 ? undefined : orderIndex + 1
                }
                onChange={() => cycleProvider(provider)}
              />
            );
          })}
        </SettingGroup>
      </div>

      <div>
        <SettingGroupHeader
          title="Form options"
          hint="Boolean flags on the auth form."
          isEdited={
            (auth.allowRegister ?? true) !==
              CONFIGURATOR_DEFAULTS.auth.allowRegister ||
            (auth.showRememberMe ?? true) !==
              CONFIGURATOR_DEFAULTS.auth.showRememberMe ||
            (auth.showForgotPassword ?? true) !==
              CONFIGURATOR_DEFAULTS.auth.showForgotPassword ||
            (auth.showFooter ?? true) !== CONFIGURATOR_DEFAULTS.auth.showFooter ||
            (auth.showLivePasswordMatch ?? true) !==
              CONFIGURATOR_DEFAULTS.auth.showLivePasswordMatch
          }
          onReset={() => {
            updateAuth("allowRegister", CONFIGURATOR_DEFAULTS.auth.allowRegister);
            updateAuth("showRememberMe", CONFIGURATOR_DEFAULTS.auth.showRememberMe);
            updateAuth(
              "showForgotPassword",
              CONFIGURATOR_DEFAULTS.auth.showForgotPassword,
            );
            updateAuth("showFooter", CONFIGURATOR_DEFAULTS.auth.showFooter);
            updateAuth(
              "showLivePasswordMatch",
              CONFIGURATOR_DEFAULTS.auth.showLivePasswordMatch,
            );
          }}
        />
        <SettingGroup>
          <SwitchRow
            label="Register tab"
            checked={auth.allowRegister ?? true}
            onChange={(v) => updateAuth("allowRegister", v)}
          />
          <SwitchRow
            label="Remember me"
            checked={auth.showRememberMe ?? true}
            onChange={(v) => updateAuth("showRememberMe", v)}
          />
          <SwitchRow
            label="Forgot password"
            checked={auth.showForgotPassword ?? true}
            onChange={(v) => updateAuth("showForgotPassword", v)}
          />
          <SwitchRow
            label="Footer"
            checked={auth.showFooter ?? true}
            onChange={(v) => updateAuth("showFooter", v)}
          />
          <SwitchRow
            label="Live password match"
            checked={auth.showLivePasswordMatch ?? true}
            onChange={(v) => updateAuth("showLivePasswordMatch", v)}
          />
        </SettingGroup>
      </div>
    </div>

    <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
      <SettingGroupHeader
        title="OAuth overflow"
        hint={
          hasOAuthOverflow
            ? `${providerCount - oauthVisibleCount} provider${providerCount - oauthVisibleCount === 1 ? "" : "s"} behind the disclosure. Order follows the provider list above.`
            : "Enable more providers than visible count to preview the disclosure."
        }
        isEdited={
          oauthVisibleCount !==
            CONFIGURATOR_DEFAULTS.auth.oauthOverflow.visibleCount ||
          (auth.oauthOverflow?.showPreviewIcons ??
            CONFIGURATOR_DEFAULTS.auth.oauthOverflow.showPreviewIcons) !==
            CONFIGURATOR_DEFAULTS.auth.oauthOverflow.showPreviewIcons
        }
        onReset={() => {
          updateOAuthOverflow(
            "visibleCount",
            CONFIGURATOR_DEFAULTS.auth.oauthOverflow.visibleCount,
          );
          updateOAuthOverflow(
            "showPreviewIcons",
            CONFIGURATOR_DEFAULTS.auth.oauthOverflow.showPreviewIcons,
          );
        }}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <NumberField
          label="Visible before disclosure"
          value={oauthVisibleCount}
          step={1}
          onChange={(value) =>
            updateOAuthOverflow(
              "visibleCount",
              resolveOAuthVisibleCount(value),
            )
          }
          isEdited={
            oauthVisibleCount !==
            CONFIGURATOR_DEFAULTS.auth.oauthOverflow.visibleCount
          }
          onReset={() =>
            updateOAuthOverflow(
              "visibleCount",
              CONFIGURATOR_DEFAULTS.auth.oauthOverflow.visibleCount,
            )
          }
        />
      </div>
      <div className="mt-3">
        <SettingGroup>
          <SwitchRow
            label="Preview icons on disclosure"
            description="Stack hidden provider icons on the show-all control."
            checked={
              auth.oauthOverflow?.showPreviewIcons ??
              CONFIGURATOR_DEFAULTS.auth.oauthOverflow.showPreviewIcons
            }
            onChange={(v) =>
              updateOAuthOverflow("showPreviewIcons", v)
            }
          />
        </SettingGroup>
      </div>
    </div>
  </div>

  );
}
