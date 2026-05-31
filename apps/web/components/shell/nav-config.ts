export type NavTag = "AI" | "HOT" | "LIVE" | "PRO";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  tag?: NavTag;
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

/** Sidebar navigation (grouped). */
export const SIDENAV: NavSection[] = [
  {
    section: "Intelligence",
    items: [
      { label: "Home", href: "/dashboard", icon: "home" },
      { label: "Confidence Board", href: "/board", icon: "grid", tag: "AI" },
      { label: "Confidence Picks", href: "/predictions", icon: "target", tag: "HOT" },
      { label: "Live Center", href: "/live", icon: "live", tag: "LIVE" },
    ],
  },
  {
    section: "Explore",
    items: [
      { label: "Fixtures", href: "/fixtures", icon: "fixtures" },
      { label: "Results", href: "/results", icon: "results" },
      { label: "Leagues", href: "/leagues", icon: "leagues" },
      { label: "Teams", href: "/teams", icon: "teams" },
      { label: "Compare", href: "/compare", icon: "analytics" },
      { label: "Players", href: "/players", icon: "players" },
    ],
  },
  {
    section: "Analysis",
    items: [
      { label: "Match Intel", href: "/match", icon: "match", tag: "AI" },
      { label: "Historical", href: "/historical", icon: "history" },
      { label: "Model Health", href: "/model-health", icon: "analytics" },
      { label: "Premium", href: "/premium", icon: "premium", tag: "PRO" },
    ],
  },
];
