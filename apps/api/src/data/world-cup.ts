/**
 * FIFA World Cup 2026 — group-stage seed data (48 nations, 12 groups).
 *
 * This is the launch dataset for the tournament. It powers the same Football
 * Data Hub + Intelligence Engine machinery as the club leagues: each group is
 * modelled as its own competition so the existing standings, fixtures, ratings
 * and prediction surfaces work unchanged.
 *
 * Ratings convention (matches `simulateGoals` in seed.ts):
 *   - `attack`  → latent scoring rate; HIGHER = scores more.
 *   - `defense` → latent stinginess; HIGHER = concedes fewer (it is the
 *                 denominator of the opponent's scoring rate). So a strong side
 *                 carries BOTH a high attack and a high defense.
 *
 * These numbers are deliberately HAND-TUNED PRIORS reflecting broad,
 * publicly-understood national-team strength tiers as of mid-2026 — not claims
 * of certainty. In line with InsightXI's statistical-integrity principle they
 * are transparent inputs that the engine turns into probabilities, never
 * guarantees. Swap this file for a live provider (API-Football) to replace the
 * priors with data-derived ratings without touching any service.
 */

export interface WcTeamSeed {
  id: string;
  name: string;
  shortName: string;
  /** Latent attacking quality (~goals scale). Higher = scores more. */
  attack: number;
  /** Latent defensive quality. Higher = concedes fewer. */
  defense: number;
}

export interface WcGroupSeed {
  /** Group letter, e.g. "A". */
  code: string;
  teams: WcTeamSeed[];
}

/**
 * The 12 groups exactly as drawn for the 48-team FIFA World Cup 2026
 * (hosted by Canada, Mexico and the United States).
 */
export const WORLD_CUP_GROUPS: WcGroupSeed[] = [
  {
    code: "A",
    teams: [
      { id: "wc-mex", name: "Mexico", shortName: "MEX", attack: 1.5, defense: 1.3 },
      { id: "wc-rsa", name: "South Africa", shortName: "RSA", attack: 1.05, defense: 1.05 },
      { id: "wc-kor", name: "South Korea", shortName: "KOR", attack: 1.4, defense: 1.25 },
      { id: "wc-cze", name: "Czechia", shortName: "CZE", attack: 1.3, defense: 1.2 },
    ],
  },
  {
    code: "B",
    teams: [
      { id: "wc-can", name: "Canada", shortName: "CAN", attack: 1.35, defense: 1.25 },
      { id: "wc-bih", name: "Bosnia-Herzegovina", shortName: "BIH", attack: 1.25, defense: 1.15 },
      { id: "wc-qat", name: "Qatar", shortName: "QAT", attack: 1.05, defense: 1.05 },
      { id: "wc-sui", name: "Switzerland", shortName: "SUI", attack: 1.5, defense: 1.35 },
    ],
  },
  {
    code: "C",
    teams: [
      { id: "wc-bra", name: "Brazil", shortName: "BRA", attack: 2.0, defense: 1.55 },
      { id: "wc-mar", name: "Morocco", shortName: "MAR", attack: 1.6, defense: 1.45 },
      { id: "wc-hai", name: "Haiti", shortName: "HAI", attack: 0.85, defense: 0.9 },
      { id: "wc-sco", name: "Scotland", shortName: "SCO", attack: 1.3, defense: 1.2 },
    ],
  },
  {
    code: "D",
    teams: [
      { id: "wc-usa", name: "United States", shortName: "USA", attack: 1.5, defense: 1.3 },
      { id: "wc-par", name: "Paraguay", shortName: "PAR", attack: 1.2, defense: 1.2 },
      { id: "wc-aus", name: "Australia", shortName: "AUS", attack: 1.25, defense: 1.2 },
      { id: "wc-tur", name: "Türkiye", shortName: "TUR", attack: 1.55, defense: 1.3 },
    ],
  },
  {
    code: "E",
    teams: [
      { id: "wc-ger", name: "Germany", shortName: "GER", attack: 1.85, defense: 1.5 },
      { id: "wc-cuw", name: "Curaçao", shortName: "CUW", attack: 0.85, defense: 0.9 },
      { id: "wc-civ", name: "Ivory Coast", shortName: "CIV", attack: 1.4, defense: 1.25 },
      { id: "wc-ecu", name: "Ecuador", shortName: "ECU", attack: 1.35, defense: 1.35 },
    ],
  },
  {
    code: "F",
    teams: [
      { id: "wc-ned", name: "Netherlands", shortName: "NED", attack: 1.85, defense: 1.5 },
      { id: "wc-jpn", name: "Japan", shortName: "JPN", attack: 1.5, defense: 1.3 },
      { id: "wc-swe", name: "Sweden", shortName: "SWE", attack: 1.3, defense: 1.25 },
      { id: "wc-tun", name: "Tunisia", shortName: "TUN", attack: 1.1, defense: 1.15 },
    ],
  },
  {
    code: "G",
    teams: [
      { id: "wc-bel", name: "Belgium", shortName: "BEL", attack: 1.8, defense: 1.4 },
      { id: "wc-egy", name: "Egypt", shortName: "EGY", attack: 1.35, defense: 1.25 },
      { id: "wc-irn", name: "Iran", shortName: "IRN", attack: 1.2, defense: 1.3 },
      { id: "wc-nzl", name: "New Zealand", shortName: "NZL", attack: 0.9, defense: 0.95 },
    ],
  },
  {
    code: "H",
    teams: [
      { id: "wc-esp", name: "Spain", shortName: "ESP", attack: 2.0, defense: 1.55 },
      { id: "wc-cpv", name: "Cape Verde", shortName: "CPV", attack: 0.95, defense: 0.95 },
      { id: "wc-ksa", name: "Saudi Arabia", shortName: "KSA", attack: 1.05, defense: 1.1 },
      { id: "wc-uru", name: "Uruguay", shortName: "URU", attack: 1.7, defense: 1.45 },
    ],
  },
  {
    code: "I",
    teams: [
      { id: "wc-fra", name: "France", shortName: "FRA", attack: 2.0, defense: 1.55 },
      { id: "wc-sen", name: "Senegal", shortName: "SEN", attack: 1.55, defense: 1.4 },
      { id: "wc-nor", name: "Norway", shortName: "NOR", attack: 1.6, defense: 1.3 },
      { id: "wc-irq", name: "Iraq", shortName: "IRQ", attack: 1.0, defense: 1.05 },
    ],
  },
  {
    code: "J",
    teams: [
      { id: "wc-arg", name: "Argentina", shortName: "ARG", attack: 2.0, defense: 1.6 },
      { id: "wc-alg", name: "Algeria", shortName: "ALG", attack: 1.35, defense: 1.25 },
      { id: "wc-aut", name: "Austria", shortName: "AUT", attack: 1.5, defense: 1.35 },
      { id: "wc-jor", name: "Jordan", shortName: "JOR", attack: 0.95, defense: 1.0 },
    ],
  },
  {
    code: "K",
    teams: [
      { id: "wc-por", name: "Portugal", shortName: "POR", attack: 1.9, defense: 1.5 },
      { id: "wc-cod", name: "Congo DR", shortName: "COD", attack: 1.25, defense: 1.2 },
      { id: "wc-uzb", name: "Uzbekistan", shortName: "UZB", attack: 1.1, defense: 1.15 },
      { id: "wc-col", name: "Colombia", shortName: "COL", attack: 1.7, defense: 1.45 },
    ],
  },
  {
    code: "L",
    teams: [
      { id: "wc-eng", name: "England", shortName: "ENG", attack: 1.95, defense: 1.55 },
      { id: "wc-cro", name: "Croatia", shortName: "CRO", attack: 1.55, defense: 1.4 },
      { id: "wc-gha", name: "Ghana", shortName: "GHA", attack: 1.3, defense: 1.2 },
      { id: "wc-pan", name: "Panama", shortName: "PAN", attack: 0.95, defense: 1.0 },
    ],
  },
];
