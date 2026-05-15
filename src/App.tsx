import { Analytics } from "@remcostoeten/analytics";
import { ThemeProvider } from "next-themes";
import { AuthDrawerLab } from "@/components/debug/auth-drawer-lab";

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <Analytics
      projectId="modal"
      ingestUrl="https://ingestion.remcostoeten.nl"
    />
    <main>
      <AuthDrawerLab />
    </main>
  </ThemeProvider>
);

export default App;
