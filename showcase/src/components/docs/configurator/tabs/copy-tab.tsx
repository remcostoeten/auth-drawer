import { DEFAULT_COPY } from "@/components/auth/auth-drawer";
import { useConfigurator } from "../context";
import { TextField } from "../../ui/fields";

export function CopyConfiguratorTab() {
  const { copy, setCopy } = useConfigurator();
  return (
  <div className="space-y-3">
    <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
      <h3 className="docs-label mb-3 text-[0.66rem] font-normal uppercase text-foreground/42">
        Login
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <TextField
          label="Title"
          value={copy.login.title}
          onChange={(value) =>
            setCopy((prev) => ({
              ...prev,
              login: { ...prev.login, title: value },
            }))
          }
          isEdited={
            copy.login.title !== DEFAULT_COPY.login.title
          }
          onReset={() =>
            setCopy((prev) => ({
              ...prev,
              login: {
                ...prev.login,
                title: DEFAULT_COPY.login.title,
              },
            }))
          }
        />
        <TextField
          label="Submit"
          value={copy.login.submit}
          onChange={(value) =>
            setCopy((prev) => ({
              ...prev,
              login: { ...prev.login, submit: value },
            }))
          }
          isEdited={
            copy.login.submit !== DEFAULT_COPY.login.submit
          }
          onReset={() =>
            setCopy((prev) => ({
              ...prev,
              login: {
                ...prev.login,
                submit: DEFAULT_COPY.login.submit,
              },
            }))
          }
        />
        <TextField
          label="Subtitle"
          value={copy.login.subtitle}
          onChange={(value) =>
            setCopy((prev) => ({
              ...prev,
              login: { ...prev.login, subtitle: value },
            }))
          }
          isEdited={
            copy.login.subtitle !==
            DEFAULT_COPY.login.subtitle
          }
          onReset={() =>
            setCopy((prev) => ({
              ...prev,
              login: {
                ...prev.login,
                subtitle: DEFAULT_COPY.login.subtitle,
              },
            }))
          }
        />
      </div>
    </div>

    <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
      <h3 className="docs-label mb-3 text-[0.66rem] font-normal uppercase text-foreground/42">
        Register
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <TextField
          label="Title"
          value={copy.register.title}
          onChange={(value) =>
            setCopy((prev) => ({
              ...prev,
              register: { ...prev.register, title: value },
            }))
          }
          isEdited={
            copy.register.title !==
            DEFAULT_COPY.register.title
          }
          onReset={() =>
            setCopy((prev) => ({
              ...prev,
              register: {
                ...prev.register,
                title: DEFAULT_COPY.register.title,
              },
            }))
          }
        />
        <TextField
          label="Submit"
          value={copy.register.submit}
          onChange={(value) =>
            setCopy((prev) => ({
              ...prev,
              register: { ...prev.register, submit: value },
            }))
          }
          isEdited={
            copy.register.submit !==
            DEFAULT_COPY.register.submit
          }
          onReset={() =>
            setCopy((prev) => ({
              ...prev,
              register: {
                ...prev.register,
                submit: DEFAULT_COPY.register.submit,
              },
            }))
          }
        />
      </div>
    </div>

    <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
      <h3 className="docs-label mb-3 text-[0.66rem] font-normal uppercase text-foreground/42">
        OAuth copy
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <TextField
          label="Show all label"
          value={copy.oauth.showAllSocial}
          onChange={(value) =>
            setCopy((prev) => ({
              ...prev,
              oauth: { ...prev.oauth, showAllSocial: value },
            }))
          }
          isEdited={
            copy.oauth.showAllSocial !==
            DEFAULT_COPY.oauth.showAllSocial
          }
          onReset={() =>
            setCopy((prev) => ({
              ...prev,
              oauth: {
                ...prev.oauth,
                showAllSocial: DEFAULT_COPY.oauth.showAllSocial,
              },
            }))
          }
        />
        <TextField
          label="Show fewer label"
          value={copy.oauth.hideAllSocial}
          onChange={(value) =>
            setCopy((prev) => ({
              ...prev,
              oauth: { ...prev.oauth, hideAllSocial: value },
            }))
          }
          isEdited={
            copy.oauth.hideAllSocial !==
            DEFAULT_COPY.oauth.hideAllSocial
          }
          onReset={() =>
            setCopy((prev) => ({
              ...prev,
              oauth: {
                ...prev.oauth,
                hideAllSocial: DEFAULT_COPY.oauth.hideAllSocial,
              },
            }))
          }
        />
        <TextField
          label="Email divider"
          value={copy.oauth.divider}
          onChange={(value) =>
            setCopy((prev) => ({
              ...prev,
              oauth: { ...prev.oauth, divider: value },
            }))
          }
          isEdited={
            copy.oauth.divider !== DEFAULT_COPY.oauth.divider
          }
          onReset={() =>
            setCopy((prev) => ({
              ...prev,
              oauth: {
                ...prev.oauth,
                divider: DEFAULT_COPY.oauth.divider,
              },
            }))
          }
        />
      </div>
    </div>

    <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
      <h3 className="docs-label mb-3 text-[0.66rem] font-normal uppercase text-foreground/42">
        Actions &amp; footer
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <TextField
          label="Remember me"
          value={copy.rememberMe.label}
          onChange={(value) =>
            setCopy((prev) => ({
              ...prev,
              rememberMe: { label: value },
            }))
          }
          isEdited={
            copy.rememberMe.label !==
            DEFAULT_COPY.rememberMe.label
          }
          onReset={() =>
            setCopy((prev) => ({
              ...prev,
              rememberMe: {
                label: DEFAULT_COPY.rememberMe.label,
              },
            }))
          }
        />
        <TextField
          label="Forgot password"
          value={copy.forgotPassword.label}
          onChange={(value) =>
            setCopy((prev) => ({
              ...prev,
              forgotPassword: {
                ...prev.forgotPassword,
                label: value,
              },
            }))
          }
          isEdited={
            copy.forgotPassword.label !==
            DEFAULT_COPY.forgotPassword.label
          }
          onReset={() =>
            setCopy((prev) => ({
              ...prev,
              forgotPassword: {
                ...prev.forgotPassword,
                label: DEFAULT_COPY.forgotPassword.label,
              },
            }))
          }
        />
        <TextField
          label="Trigger title"
          value={copy.trigger.title}
          onChange={(value) =>
            setCopy((prev) => ({
              ...prev,
              trigger: { ...prev.trigger, title: value },
            }))
          }
          isEdited={
            copy.trigger.title !==
            DEFAULT_COPY.trigger.title
          }
          onReset={() =>
            setCopy((prev) => ({
              ...prev,
              trigger: {
                ...prev.trigger,
                title: DEFAULT_COPY.trigger.title,
              },
            }))
          }
        />
      </div>
    </div>
  </div>

  );
}
