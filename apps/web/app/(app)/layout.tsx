import { AppShell } from "../../components/shell/app-shell";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <main className="page">{children}</main>
    </AppShell>
  );
}
