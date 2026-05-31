import { AppShell } from "../../components/shell/app-shell";
import { PhoneRedirect } from "../../modules/mobile/phone-redirect";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <PhoneRedirect />
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <main id="main-content" className="page" tabIndex={-1}>
        {children}
      </main>
    </AppShell>
  );
}
