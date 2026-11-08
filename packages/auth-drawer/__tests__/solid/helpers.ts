import { fireEvent } from "@solidjs/testing-library";
import { vi } from "vitest";
import {
  createAdapter,
  createPushSession,
  type AuthAdapter,
  type SessionSnapshot,
} from "@remcostoeten/auth-drawer/core";

export const credentials = {
  email: "test@example.com",
  password: "password123",
  rememberMe: false,
};

export const SIGNED_OUT: SessionSnapshot = { data: null, isPending: false, error: null };

export const SIGNED_IN: SessionSnapshot = {
  data: {
    user: { id: "user_1", email: "test@example.com" },
    session: { id: "session_1" },
  },
  isPending: false,
  error: null,
};

export function createTestAdapter(overrides: Partial<AuthAdapter> = {}): AuthAdapter {
  return createAdapter({
    id: "test",
    providers: [],
    signIn: vi.fn(async () => ({ success: true })),
    ...overrides,
  });
}

export function createSessionAwareAdapter() {
  const { source, push } = createPushSession(SIGNED_OUT);
  const adapter = createTestAdapter({
    signIn: vi.fn(async () => {
      push(SIGNED_IN);
      return { success: true, data: SIGNED_IN.data };
    }),
    session: source,
  });

  return { adapter, push };
}

export function dialog() {
  return document.body.querySelector('[role="dialog"]');
}

export function field(selector: string) {
  const element = document.body.querySelector<HTMLInputElement>(selector);
  if (!element) throw new Error(`Missing element ${selector}`);
  return element;
}

export function type(selector: string, value: string) {
  fireEvent.input(field(selector), { target: { value } });
}

export function click(element: Element | null | undefined) {
  if (!element) throw new Error("Cannot click a missing element");
  fireEvent.click(element);
}

export function findButton(label: string) {
  return Array.from(document.body.querySelectorAll("button")).find(
    (button) => button.getAttribute("aria-label") === label || button.textContent?.includes(label),
  );
}

export function submitButton() {
  return field('button[type="submit"]');
}

export function badges() {
  return Array.from(document.body.querySelectorAll("[data-auth-badge]")).map((node) => {
    const button = node.closest("button");
    const label = button?.getAttribute("aria-label");
    return label ?? button?.textContent?.replace(node.textContent ?? "", "");
  });
}

export async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}
