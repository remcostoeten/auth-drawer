import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  // scrypt hash, stored as "<salt>:<derivedKey>" — never the raw password.
  passwordHash: text("password_hash").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Note: the express-session store table is created automatically by
// connect-pg-simple (`createTableIfMissing`), so it is not modelled here.

export type UserRow = typeof users.$inferSelect;
