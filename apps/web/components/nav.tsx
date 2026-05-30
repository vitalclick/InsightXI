import Link from "next/link";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/results", label: "Results" },
  { href: "/standings", label: "Standings" },
  { href: "/live", label: "Live" },
  { href: "/trends", label: "Trends" },
  { href: "/model-health", label: "Model" },
  { href: "/account", label: "Account" },
];

export function Nav() {
  return (
    <header className="border-b border-white/10 bg-pitch/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
        <Link href="/" className="font-bold tracking-tight">
          Insight<span className="text-insight">XI</span>
        </Link>
        <ul className="flex flex-wrap gap-5 text-sm text-white/70">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="hover:text-white">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
