import { describe, expect, it } from "vitest";
import { DEFAULT_COPY } from "../../src/core/copy";
import { getPasswordMatchFeedback, validateCredentials } from "../../src/core/validation";

describe("validateCredentials", () => {
  it("returns field errors for empty login credentials", () => {
    const result = validateCredentials(
      {
        mode: "login",
        email: "",
        password: "",
      },
      DEFAULT_COPY,
    );

    expect(result.fields.email?.code).toBe("required");
    expect(result.fields.password?.code).toBe("required");
  });

  it("validates register password strength and confirmation", () => {
    const result = validateCredentials(
      {
        mode: "register",
        email: "person@example.com",
        password: "short",
        confirmPassword: "different",
      },
      DEFAULT_COPY,
    );

    expect(result.fields.password?.code).toBe("weak_password");
    expect(result.fields.confirmPassword?.code).toBe("password_mismatch");
  });

  it("accepts valid register credentials", () => {
    const result = validateCredentials(
      {
        mode: "register",
        email: "person@example.com",
        password: "long-enough",
        confirmPassword: "long-enough",
      },
      DEFAULT_COPY,
    );

    expect(result.fields).toEqual({});
  });

  it("only validates the email address in magic link mode", () => {
    const invalid = validateCredentials(
      {
        mode: "magicLink",
        email: "not-an-email",
      },
      DEFAULT_COPY,
    );

    expect(invalid.fields.email?.code).toBe("invalid_email");
    expect(invalid.fields.password).toBeUndefined();

    const valid = validateCredentials(
      {
        mode: "magicLink",
        email: "person@example.com",
      },
      DEFAULT_COPY,
    );

    expect(valid.fields).toEqual({});
  });

  it("derives live password match feedback for register mode", () => {
    expect(
      getPasswordMatchFeedback(
        {
          mode: "register",
          password: "long-enough",
          confirmPassword: "long-enougX",
        },
        DEFAULT_COPY,
      ),
    ).toEqual({
      tone: "error",
      message: "Passwords do not match.",
    });

    expect(
      getPasswordMatchFeedback(
        {
          mode: "register",
          password: "long-enough",
          confirmPassword: "long-enough",
        },
        DEFAULT_COPY,
      ),
    ).toEqual({
      tone: "success",
      message: "Passwords match.",
    });
  });
});
