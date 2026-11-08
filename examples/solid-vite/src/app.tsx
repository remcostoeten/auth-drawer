import { Show } from "solid-js";
import {
  AuthDrawer,
  AuthProvider,
  OAUTH_PROVIDER_IDS,
  useAuth,
  type AuthConfig,
} from "@remcostoeten/auth-drawer/solid";
import { createMockAdapter } from "@remcostoeten/auth-drawer/solid/adapters/mock";

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
  const auth = useAuth();

  return (
    <Show
      when={auth.user()}
      fallback={<p>Signed out. Demo credentials are filled in: admin@example.com / password.</p>}
    >
      {(user) => (
        <p>
          Signed in as {user().email}{" "}
          <button class="plain" type="button" onClick={() => void auth.signOut()}>
            Sign out
          </button>
        </p>
      )}
    </Show>
  );
}

export function App() {
  return (
    <AuthProvider adapter={adapter}>
      <main class="page">
        <h1>Auth Drawer for Solid</h1>
        <Status />
        <button class="plain" type="button" onClick={toggleTheme}>
          Toggle dark mode
        </button>
        <AuthDrawer
          adapter={adapter}
          config={config}
          defaultOpen={params.get("open") !== "0"}
          onOpenChange={() => {}}
        />
      </main>
    </AuthProvider>
  );
}
