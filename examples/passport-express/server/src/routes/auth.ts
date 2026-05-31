import { Router } from "express";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import passport from "../lib/passport-config";
import { db } from "../db/connection";
import { users } from "../db/schema";
import { hashPassword } from "../lib/passwords";

const router = Router();

// GET /user — returns the logged-in user or 401
router.get("/user", (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthenticated." });
  res.json(req.user);
});

// POST /login — Passport local strategy
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err: unknown, user: Express.User | false) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: "Invalid credentials." });
    req.logIn(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      res.json(user);
    });
  })(req, res, next);
});

// POST /register — create account then log in
router.post("/register", async (req, res, next) => {
  try {
    const { username, password, name } = req.body as {
      username?: string;
      password?: string;
      name?: string;
    };

    if (!username || !password || !name) {
      return res.status(400).json({ message: "username, password, and name are required." });
    }

    const [existing] = await db.select().from(users).where(eq(users.email, username));
    if (existing) return res.status(409).json({ message: "Email already registered." });

    const [user] = await db
      .insert(users)
      .values({ id: randomUUID(), email: username, name, passwordHash: await hashPassword(password) })
      .returning({ id: users.id, email: users.email, name: users.name, image: users.image });

    req.logIn(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  } catch (err) {
    next(err);
  }
});

// POST /logout
router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ success: true });
  });
});

export default router;
