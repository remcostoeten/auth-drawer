/**
 * @name suggestEmailCompletion
 * @description Returns the full address to suggest for a partially typed email, completing the
 * domain from the first matching entry in `domains`. Returns an empty string when there is no
 * `@`, no matching domain, or the domain is already complete.
 *
 * @example
 * suggestEmailCompletion("ada@gm", ["gmail.com"]); // "ada@gmail.com"
 */
export function suggestEmailCompletion(value: string, domains: readonly string[]): string {
  if (!value.includes("@")) return "";

  const [local, domain] = value.split("@");
  if (domain === undefined) return "";

  const match = domains.find((item) => item.startsWith(domain));
  return match && match !== domain ? `${local}@${match}` : "";
}
