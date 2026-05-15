type Props = {
  error?: string | null;
  id?: string;
  tone?: "error" | "success";
};

/**
 * Announces form validation feedback when present.
 *
 * @param props - Optional error text and element id.
 * @returns Accessible alert text or null.
 */
export function ValidationMessage({ error, id, tone = "error" }: Props) {
  if (!error) return null;

  return (
    <p
      id={id}
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "mt-1.5 flex items-center gap-1.5 text-[0.8125rem] text-overlay-error"
          : "mt-1.5 flex items-center gap-1.5 text-[0.8125rem] text-overlay-muted"
      }
    >
      {error}
    </p>
  );
}
