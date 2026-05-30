import { OpenDashboardButton } from "@/components/open-dashboard-button";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
        Example app
      </p>
      <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-neutral-950">
        Custom JWT REST backend and Auth Drawer in Next.js
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600">
        This app follows the Custom JWT setup guide from the Auth Drawer docs: a
        REST auth API under{" "}
        <code className="rounded bg-neutral-200 px-1 py-0.5 font-mono text-[0.8rem]">
          /api/auth
        </code>{" "}
        that signs and verifies JWTs, password hashing with scrypt, Drizzle on
        PostgreSQL, and{" "}
        <code className="rounded bg-neutral-200 px-1 py-0.5 font-mono text-[0.8rem]">
          createCustomJwtAdapter
        </code>
        .
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <OpenDashboardButton />
        <a
          href="https://auth-drawer.remcostoeten.nl/docs#sdk-custom-jwt"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 transition-colors hover:bg-white"
        >
          Read the docs guide
        </a>
      </div>
      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "HttpOnly cookie sessions",
            body: "Login issues a signed JWT into an HttpOnly cookie — XSS-safe, and replayed automatically to /api/auth/me.",
          },
          {
            title: "Email + password",
            body: "Register and sign in through the drawer. Passwords are scrypt-hashed in Postgres.",
          },
          {
            title: "Global session",
            body: "AuthProvider exposes useAuth() for header actions and protected pages.",
          },
        ].map((item) => (
          <article
            key={item.title}
            className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-sm font-semibold text-neutral-900">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{item.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
