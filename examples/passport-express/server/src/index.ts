import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db/connection";
import passport from "./lib/passport-config";
import authRouter from "./routes/auth";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const WEB_URL = process.env.WEB_URL ?? "http://localhost:3006";

app.use(cors({ origin: WEB_URL, credentials: true }));
app.use(express.json());

const PgSession = connectPgSimple(session);
app.use(
  session({
    store: new PgSession({ pool, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());
app.use(authRouter);

app.listen(PORT, () => {
  console.log(`→ Passport Express server listening on http://localhost:${PORT}`);
});
