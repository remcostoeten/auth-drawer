import { describe, expect, it } from "vitest";
import { normalizeAuthError } from "../src/auth-errors";

describe("normalizeAuthError", () => {
  it("maps Supabase-style invalid credential errors", () => {
    const result = normalizeAuthError({
      code: "invalid_credentials",
      message: "Invalid login credentials",
      status: 400,
    });

    expect(result.code).toBe("invalid_credentials");
    expect(result.target).toBe("form");
  });

  it("maps Better Auth-style nested errors", () => {
    const result = normalizeAuthError({
      error: {
        code: "USER_ALREADY_EXISTS",
        message: "User already exists",
      },
    });

    expect(result.code).toBe("email_taken");
    expect(result.target).toBe("email");
  });

  it("maps OAuth cancellation to an OAuth target", () => {
    const result = normalizeAuthError("Popup closed by user", {
      provider: "google",
    });

    expect(result.code).toBe("oauth_cancelled");
    expect(result.target).toBe("oauth");
    expect(result.provider).toBe("google");
  });
});
