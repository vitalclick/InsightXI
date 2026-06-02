import {
  AdminTransaction,
  AuditEntry,
  ContentPost,
  FeatureFlag,
  SupportTicket,
} from "./admin.types";

/**
 * Deterministic seed data for the admin subsystems. Self-contained (no
 * dependency on the live user cohort) so it can populate either the in-memory
 * store or a fresh Postgres database identically.
 */

function rng(s: number): number {
  const x = Math.sin(s) * 10000;
  return x - Math.floor(x);
}
function pick<T>(arr: readonly T[], s: number): T {
  return arr[Math.floor(rng(s) * arr.length)];
}
const NOW = new Date("2026-05-31T12:00:00Z");
function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * 86_400_000).toISOString();
}
function minsAgo(n: number): string {
  return new Date(NOW.getTime() - n * 60_000).toISOString();
}

const FIRST = [
  "Liam", "Olivia", "Noah", "Emma", "Arjun", "Priya", "Wei", "Mei", "Sofia",
  "Mateo", "Aisha", "Omar", "Lucas", "Chloe", "Ethan", "Ava", "Zara", "Ravi",
  "Diego", "Camila", "Elena", "Felix", "Nora", "Idris", "Sven", "Marco",
];
const LAST = [
  "Patel", "Smith", "Nguyen", "Kim", "Garcia", "Rossi", "Tanaka", "Khan",
  "Mueller", "Silva", "Johnson", "Wang", "Okafor", "Andersson", "Costa",
  "Haddad", "Dubois", "Santos", "Reyes", "Park", "Romano",
];
const AUTHORS = ["Alex Mercer", "Priya Raman", "Daniel Cole", "Sara Lindqvist"];

function demoName(i: number): { name: string; email: string } {
  const s = i * 13 + 7;
  const fn = pick(FIRST, s);
  const ln = pick(LAST, s * 2 + 1);
  const domains = ["gmail.com", "outlook.com", "proton.me", "icloud.com", "yahoo.com"];
  return {
    name: `${fn} ${ln}`,
    email: `${fn}.${ln}`.toLowerCase().replace(/[^a-z.]/g, "") + "@" + pick(domains, s),
  };
}

export function seedTickets(): SupportTicket[] {
  const subjects: [string, string, SupportTicket["priority"]][] = [
    ["Premium not unlocking after payment", "Billing", "High"],
    ["Confidence board not loading on iOS", "Bug", "High"],
    ["Request: export picks to CSV", "Feature", "Low"],
    ["Wrong scoreline shown for live match", "Data", "Medium"],
    ["Cancel subscription and refund", "Billing", "Medium"],
    ["Login link expired", "Account", "Low"],
    ["Push notifications not arriving", "Bug", "Medium"],
    ["Annual plan discount not applied", "Billing", "High"],
    ["Add La Liga coverage", "Feature", "Low"],
    ["Radar chart overlaps on tablet", "Bug", "Low"],
    ["Duplicate charge this month", "Billing", "High"],
    ["How is model accuracy calculated?", "Question", "Low"],
  ];
  const closed = ["Open", "Pending", "Closed"] as const;
  return subjects.map((t, i) => {
    const s = i * 17 + 3;
    return {
      id: `TKT-${2100 + i}`,
      subject: t[0],
      category: t[1],
      priority: t[2],
      status: i < 7 ? pick(["Open", "Pending", "Open"] as const, s) : pick(closed, s),
      requester: demoName(i * 5 + 2).name,
      assignee: i % 3 === 0 ? "Unassigned" : AUTHORS[i % AUTHORS.length],
      date: daysAgo(Math.floor(rng(s) * 12)),
    };
  });
}

export function seedPosts(): ContentPost[] {
  const posts: [string, string, ContentPost["status"], number][] = [
    ["The pressing revolution: how counter-press wins titles", "Tactical", "Published", 18_400],
    ["xG explained: reading the model behind the numbers", "Analytics", "Published", 24_100],
    ["Five clubs overperforming their underlying data", "Trends", "Published", 12_800],
    ["Set-piece intelligence: the hidden 41%", "Tactical", "Scheduled", 0],
    ["Fatigue modelling and the congested fixture list", "Analytics", "Draft", 0],
    ["Matchday 31 preview: every confidence pick", "Preview", "Published", 9_600],
    ["How we calibrate confidence at InsightXI", "Product", "Draft", 0],
    ["Transition defence: the metric nobody tracks", "Tactical", "Published", 7_300],
  ];
  return posts.map((p, i) => ({
    id: `post_${300 + i}`,
    title: p[0],
    category: p[1],
    status: p[2],
    views: p[3],
    author: AUTHORS[i % AUTHORS.length],
    date: daysAgo(Math.floor(rng(i * 7 + 2) * 40)),
  }));
}

export function seedFlags(): FeatureFlag[] {
  return [
    { key: "live_winprob", name: "Live win-probability tracker", description: "Real-time stacked win-prob on live matches", enabled: true },
    { key: "mobile_pwa", name: "Mobile PWA install prompt", description: "Show add-to-home-screen banner", enabled: true },
    { key: "confidence_v2", name: "Confidence board v2", description: "New confidence ranking algorithm", enabled: false },
    { key: "laliga", name: "La Liga coverage", description: "Enable Spanish top-flight fixtures", enabled: false },
    { key: "ai_assistant", name: "AI match assistant (beta)", description: "Conversational match intel", enabled: true },
  ];
}

export function seedTransactions(): AdminTransaction[] {
  const methods = ["Visa ··4291", "Mastercard ··8830", "PayPal", "Apple Pay"];
  const statuses = ["Paid", "Paid", "Paid", "Paid", "Failed", "Refunded"] as const;
  const out: AdminTransaction[] = [];
  for (let i = 0; i < 22; i++) {
    const s = i * 9 + 3;
    const annual = rng(s) > 0.6;
    const who = demoName(i * 3 + 1);
    out.push({
      id: `in_${9100 + i}`,
      userName: who.name,
      email: who.email,
      plan: annual ? "Annual" : "Monthly",
      amount: annual ? 79 : 9.99,
      status: pick(statuses, s * 3 + 1),
      method: pick(methods, s),
      date: daysAgo(Math.floor(rng(s * 5) * 60)),
    });
  }
  out.sort((a, b) => b.date.localeCompare(a.date));
  return out;
}

export function seedAudit(): AuditEntry[] {
  const actions: [string, string][] = [
    ["suspended user", "usr_1058"],
    ["changed plan to Premium", "usr_1071"],
    ["published post", "post_300"],
    ["refunded invoice", "in_9104"],
    ["edited fixture", "RVS v KGT"],
    ["featured match of the day", "RVS v KGT"],
    ["invited team member", "sara@insightxi.app"],
    ["updated role to Analyst", "usr_1063"],
    ["closed ticket", "TKT-2103"],
    ["exported users CSV", "64 records"],
    ["toggled feature flag", "live_winprob"],
    ["deleted draft", "post_307"],
    ["sent broadcast", "12,480 users"],
    ["impersonated user", "usr_1049"],
    ["retrained model", "v4.2"],
  ];
  const admins = ["Alex Mercer", "Priya Raman", "Daniel Cole"];
  return actions.map((a, i) => ({
    id: `log_${i}`,
    actor: admins[i % admins.length],
    action: a[0],
    target: a[1],
    ip: `102.0.${10 + i}.${(i * 7) % 250}`,
    at: minsAgo(i * 47 + Math.floor(rng(i * 3) * 40)),
  }));
}
