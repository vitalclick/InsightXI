/**
 * InsightXI Mobile — deterministic seed data.
 *
 * Ported from the design prototype (design/assets/js/data.js) to a typed
 * module. Fictional, PL-style clubs/players so the mobile experience renders
 * offline with stable values. Swap for a live `FootballDataProvider` later.
 */

export type FormResult = "W" | "D" | "L";

export interface Club {
  name: string;
  short: string;
  city: string;
  c1: string;
  c2: string;
  att: number;
  def: number;
  mid: number;
  xg: number;
  xga: number;
  poss: number;
  form: FormResult[];
  pos: number;
  pts: number;
  pld: number;
  gd: number;
}

export type ClubCode = string;

export const CLUBS: Record<ClubCode, Club> = {
  RVS: { name: "Riverside FC", short: "RVS", city: "Riverside", c1: "#c8102e", c2: "#7a0a1d", att: 88, def: 81, mid: 85, xg: 2.14, xga: 0.92, poss: 61, form: ["W", "W", "D", "W", "W"], pos: 1, pts: 67, pld: 30, gd: 41 },
  KGT: { name: "Kingsgate United", short: "KGT", city: "Kingsgate", c1: "#0b3d91", c2: "#06224f", att: 86, def: 84, mid: 83, xg: 1.98, xga: 0.81, poss: 58, form: ["W", "W", "W", "D", "W"], pos: 2, pts: 65, pld: 30, gd: 38 },
  ASH: { name: "Ashford City", short: "ASH", city: "Ashford", c1: "#00a36c", c2: "#015c3d", att: 83, def: 79, mid: 81, xg: 1.86, xga: 1.05, poss: 56, form: ["W", "D", "W", "L", "W"], pos: 3, pts: 60, pld: 30, gd: 27 },
  HRT: { name: "Hartwell Town", short: "HRT", city: "Hartwell", c1: "#6a1b9a", c2: "#3d0f59", att: 80, def: 82, mid: 78, xg: 1.71, xga: 0.97, poss: 53, form: ["D", "W", "W", "W", "D"], pos: 4, pts: 57, pld: 30, gd: 21 },
  NTH: { name: "Northfield", short: "NTH", city: "Northfield", c1: "#e67e00", c2: "#9c5500", att: 79, def: 76, mid: 79, xg: 1.64, xga: 1.18, poss: 54, form: ["W", "L", "W", "D", "W"], pos: 5, pts: 53, pld: 30, gd: 14 },
  BRK: { name: "Brookmoor", short: "BRK", city: "Brookmoor", c1: "#00838f", c2: "#014b52", att: 77, def: 78, mid: 76, xg: 1.55, xga: 1.12, poss: 51, form: ["L", "W", "D", "W", "D"], pos: 6, pts: 50, pld: 30, gd: 9 },
  CLF: { name: "Cliffton Rovers", short: "CLF", city: "Cliffton", c1: "#b71c1c", c2: "#6e0f0f", att: 75, def: 74, mid: 74, xg: 1.48, xga: 1.24, poss: 49, form: ["D", "D", "W", "L", "W"], pos: 7, pts: 46, pld: 30, gd: 4 },
  MRD: { name: "Meadowvale", short: "MRD", city: "Meadowvale", c1: "#1565c0", c2: "#0c3c73", att: 73, def: 75, mid: 72, xg: 1.39, xga: 1.21, poss: 48, form: ["W", "D", "L", "D", "W"], pos: 8, pts: 44, pld: 30, gd: 1 },
  STG: { name: "Stonegate", short: "STG", city: "Stonegate", c1: "#2e7d32", c2: "#1a4a1d", att: 71, def: 72, mid: 70, xg: 1.31, xga: 1.34, poss: 47, form: ["L", "D", "W", "D", "L"], pos: 9, pts: 41, pld: 30, gd: -4 },
  WLM: { name: "Wellminster", short: "WLM", city: "Wellminster", c1: "#455a64", c2: "#263238", att: 69, def: 73, mid: 69, xg: 1.24, xga: 1.29, poss: 46, form: ["D", "L", "D", "W", "D"], pos: 10, pts: 39, pld: 30, gd: -7 },
  PRT: { name: "Port Haven", short: "PRT", city: "Port Haven", c1: "#d84315", c2: "#8a2a0d", att: 67, def: 68, mid: 67, xg: 1.18, xga: 1.41, poss: 45, form: ["L", "W", "L", "D", "L"], pos: 11, pts: 35, pld: 30, gd: -12 },
  FNL: { name: "Fenlow Athletic", short: "FNL", city: "Fenlow", c1: "#5d4037", c2: "#33211c", att: 64, def: 66, mid: 64, xg: 1.09, xga: 1.52, poss: 43, form: ["L", "L", "D", "L", "W"], pos: 12, pts: 31, pld: 30, gd: -19 },
};

export interface LiveMatch {
  id: string;
  home: ClubCode;
  away: ClubCode;
  hs: number;
  as: number;
  min: number;
  status: "live";
  comp: string;
  hxg: number;
  axg: number;
  momentum: "home" | "away";
  conf: number;
  pick: string;
  stadium: string;
  att: number;
}

export interface UpcomingMatch {
  id: string;
  home: ClubCode;
  away: ClubCode;
  time: string;
  date: string;
  comp: string;
  conf: number;
  pick: string;
  hp: number;
  dp: number;
  ap: number;
  stadium: string;
  importance: "high" | "mid" | "low";
}

export interface ResultMatch {
  home: ClubCode;
  away: ClubCode;
  hs: number;
  as: number;
  hxg: number;
  axg: number;
  comp: string;
  date: string;
  verdict: "hit" | "miss";
}

export interface FeatureMatch {
  id: string;
  home: ClubCode;
  away: ClubCode;
  comp: string;
  round: string;
  date: string;
  time: string;
  stadium: string;
  city: string;
  weather: { t: number; cond: string; wind: number };
  ref: string;
  att: number;
  pred: { home: number; draw: number; away: number; o15: number; o25: number; btts: number; conf: number };
  hForm: FormResult[];
  aForm: FormResult[];
}

/** Any match shape that the Match Intel screen can normalise. */
export type AnyMatch = Partial<LiveMatch & UpcomingMatch & FeatureMatch> & {
  home: ClubCode;
  away: ClubCode;
};

export const NOW_LIVE: LiveMatch[] = [
  { id: "m1", home: "RVS", away: "HRT", hs: 2, as: 1, min: 67, status: "live", comp: "Premier League", hxg: 1.84, axg: 0.91, momentum: "home", conf: 78, pick: "RVS", stadium: "Riverside Park", att: 41200 },
  { id: "m2", home: "ASH", away: "BRK", hs: 1, as: 1, min: 54, status: "live", comp: "Premier League", hxg: 1.22, axg: 1.31, momentum: "away", conf: 61, pick: "Draw", stadium: "Ashford Arena", att: 32800 },
  { id: "m3", home: "NTH", away: "CLF", hs: 0, as: 0, min: 23, status: "live", comp: "Premier League", hxg: 0.44, axg: 0.38, momentum: "home", conf: 55, pick: "NTH", stadium: "Northfield Ground", att: 24100 },
];

export const UPCOMING: UpcomingMatch[] = [
  { id: "u1", home: "KGT", away: "RVS", time: "17:30", date: "Today", comp: "Premier League", conf: 71, pick: "KGT", hp: 44, dp: 27, ap: 29, stadium: "Kingsgate Stadium", importance: "high" },
  { id: "u2", home: "BRK", away: "NTH", time: "20:00", date: "Today", comp: "Premier League", conf: 58, pick: "NTH", hp: 31, dp: 28, ap: 41, stadium: "Brookmoor Field", importance: "mid" },
  { id: "u3", home: "HRT", away: "ASH", time: "15:00", date: "Tomorrow", comp: "Premier League", conf: 64, pick: "HRT", hp: 48, dp: 26, ap: 26, stadium: "Hartwell Park", importance: "high" },
  { id: "u4", home: "MRD", away: "STG", time: "15:00", date: "Tomorrow", comp: "Premier League", conf: 52, pick: "MRD", hp: 42, dp: 30, ap: 28, stadium: "Meadow Lane", importance: "low" },
  { id: "u5", home: "WLM", away: "PRT", time: "17:30", date: "Tomorrow", comp: "Premier League", conf: 60, pick: "WLM", hp: 46, dp: 29, ap: 25, stadium: "Wellminster Road", importance: "mid" },
  { id: "u6", home: "CLF", away: "FNL", time: "12:30", date: "Sat", comp: "Premier League", conf: 73, pick: "CLF", hp: 55, dp: 24, ap: 21, stadium: "Cliffton Rise", importance: "mid" },
];

export const RESULTS: ResultMatch[] = [
  { home: "RVS", away: "NTH", hs: 3, as: 0, hxg: 2.71, axg: 0.62, comp: "Premier League", date: "2 days ago", verdict: "hit" },
  { home: "KGT", away: "BRK", hs: 2, as: 1, hxg: 1.94, axg: 1.1, comp: "Premier League", date: "2 days ago", verdict: "hit" },
  { home: "ASH", away: "WLM", hs: 1, as: 1, hxg: 1.33, axg: 0.88, comp: "Premier League", date: "3 days ago", verdict: "miss" },
  { home: "HRT", away: "MRD", hs: 2, as: 0, hxg: 1.81, axg: 0.74, comp: "Premier League", date: "3 days ago", verdict: "hit" },
  { home: "STG", away: "PRT", hs: 1, as: 2, hxg: 1.12, axg: 1.44, comp: "Premier League", date: "4 days ago", verdict: "hit" },
  { home: "CLF", away: "FNL", hs: 0, as: 0, hxg: 0.91, axg: 0.78, comp: "Premier League", date: "5 days ago", verdict: "miss" },
];

/** The signature match powering the Match Intelligence screen. */
export const FEATURE_MATCH: FeatureMatch = {
  id: "feat", home: "RVS", away: "KGT", comp: "Premier League", round: "Matchday 31",
  date: "Sat 1 June", time: "17:30", stadium: "Riverside Park", city: "Riverside",
  weather: { t: 18, cond: "Clear", wind: 11 }, ref: "M. Atkins", att: 41200,
  pred: { home: 47, draw: 27, away: 26, o15: 84, o25: 58, btts: 61, conf: 74 },
  hForm: ["W", "W", "D", "W", "W"], aForm: ["W", "W", "W", "D", "W"],
};

export const CLUB_CODES: ClubCode[] = Object.keys(CLUBS);

/** Deterministic pseudo-random in [0,1) — matches the prototype's seeding. */
export function rnd(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/** xG race-style minute series for the live charts. */
export function xgRace(seed: number, mins: number): { a: { m: number; v: number }[]; b: { m: number; v: number }[] } {
  const a: { m: number; v: number }[] = [];
  const b: { m: number; v: number }[] = [];
  let va = 0;
  let vb = 0;
  for (let m = 0; m <= mins; m += 3) {
    va += rnd(seed + m) * 0.16;
    vb += rnd(seed + m + 100) * 0.12;
    a.push({ m, v: +va.toFixed(2) });
    b.push({ m, v: +vb.toFixed(2) });
  }
  return { a, b };
}

export function clubName(code: ClubCode): string {
  return CLUBS[code] ? CLUBS[code].name : code;
}
