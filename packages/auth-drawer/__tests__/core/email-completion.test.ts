import { describe, expect, it } from "vitest";
import { DOMAINS, suggestEmailCompletion } from "../../src/core";

describe("suggestEmailCompletion", () => {
  it("completes a partial domain from the first match", () => {
    expect(suggestEmailCompletion("ada@gm", DOMAINS)).toBe("ada@gmail.com");
    expect(suggestEmailCompletion("ada@", ["a.com", "b.com"])).toBe("ada@a.com");
  });

  it("suggests nothing without an @ or a matching domain", () => {
    expect(suggestEmailCompletion("ada", DOMAINS)).toBe("");
    expect(suggestEmailCompletion("ada@zzz", DOMAINS)).toBe("");
  });

  it("suggests nothing once the domain is complete", () => {
    expect(suggestEmailCompletion("ada@gmail.com", DOMAINS)).toBe("");
  });

  it("uses only the domain before a second @", () => {
    expect(suggestEmailCompletion("a@gm@x", DOMAINS)).toBe("a@gmail.com");
  });
});
