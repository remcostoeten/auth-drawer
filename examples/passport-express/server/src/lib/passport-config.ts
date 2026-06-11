import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { eq } from "drizzle-orm";
import { db } from "../db/connection";
import { users } from "../db/schema";
import { verifyPassword } from "./passwords";

passport.use(
  new LocalStrategy({ usernameField: "username" }, async (username, password, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, username));
      if (!user) return done(null, false, { message: "User not found." });
      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) return done(null, false, { message: "Invalid credentials." });
      return done(null, { id: user.id, email: user.email, name: user.name, image: user.image });
    } catch (err) {
      return done(err);
    }
  }),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return done(null, false);
    done(null, { id: user.id, email: user.email, name: user.name, image: user.image });
  } catch (err) {
    done(err);
  }
});

export default passport;
