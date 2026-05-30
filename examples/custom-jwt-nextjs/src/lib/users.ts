import type { UserRow } from "@/db/schema";

/** Shape sent to the client — never includes the password hash. */
export type PublicUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
};

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    image: row.image,
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
