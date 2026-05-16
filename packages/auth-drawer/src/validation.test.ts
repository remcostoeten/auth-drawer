import { describe, expect, it } from "vitest";
import { getPasswordMatchFeedback, validateCredentials } from "./validation";

describe("validateCredentials", () => {
  it("returns field errors for empty login credentials", () => {
    const result = validateCredentials({
      mode: "login",
      email: "",
      password: "",
    });

    expect(result.fields.email?.code).toBe("required");
    expect(result.fields.password?.code).toBe("required");
  });

  it("validates register password strength and confirmation", () => {
    const result = validateCredentials({
      mode: "register",
      email: "person@example.com",
      password: "short",
      confirmPassword: "different",
    });

    expect(result.fields.password?.code).toBe("weak_password");
    expect(result.fields.confirmPassword?.code).toBe("password_mismatch");
  });

  it("accepts valid register credentials", () => {
    const result = validateCredentials({
      mode: "register",
      email: "person@example.com",
      password: "long-enough",
      confirmPassword: "long-enough",
    });

    expect(result.fields).toEqual({});
  });

  it("derives live password match feedback for register mode", () => {
    expect(
      getPasswordMatchFeedback({
        mode: "register",
        password: "long-enough",
        confirmPassword: "long-enougX",
      }),
    ).toEqual({
      tone: "error",
      message: "Passwords do not match.",
    });

    expect(
      getPasswordMatchFeedback({
        mode: "register",
        password: "long-enough",
        confirmPassword: "long-enough",
      }),
    ).toEqual({
      tone: "success",
      message: "Passwords match.",
    });
  });
});
