import {
  AuthDrawer,
  AuthProvider,
  OAUTH_PROVIDER_IDS,
  useAuth,
  type AuthConfig,
} from "@remcostoeten/auth-drawer/react";
import { createMockAdapter } from "@remcostoeten/auth-drawer/react/adapters/mock";

const params = new URLSearchParams(window.location.search);
const adapter = createMockAdapter({ latencyMs: 600 });

const config: AuthConfig = {
  ui: {
    presentation: { variant: params.get("variant") === "modal" ? "modal" : "drawer" },
    auth: {
      providers: [...OAUTH_PROVIDER_IDS],
      initialMode: params.get("mode") === "register" ? "register" : "login",
    },
  },
};

if (params.get("theme") === "dark") document.documentElement.classList.add("dark");

function toggleTheme() {
  document.documentElement.classList.toggle("dark");
}

function Status() {
  const { user, signOut, openDrawer } = useAuth();

  return user ? (
    <p>
      Signed in as {user.email}{" "}
      <button className="plain" type="button" onClick={() => void signOut()}>
        Sign out
      </button>
    </p>
  ) : (
    <p>
      Signed out. Demo credentials are filled in: admin@example.com / password.{" "}
      <button className="plain" type="button" onClick={openDrawer}>
        Open drawer
      </button>
    </p>
  );
}

export function App() {
  return (
    <AuthProvider adapter={adapter}>
      <main className="page">
        <h1>Auth Drawer for React</h1>
        <Status />
        <button className="plain" type="button" onClick={toggleTheme}>
          Toggle dark mode
        </button>
        <AuthDrawer adapter={adapter} config={config} defaultOpen={params.get("open") !== "0"} />
      </main>
    </AuthProvider>
  );
}
