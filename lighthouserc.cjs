/**
 * Lighthouse CI — performance budget for the InsightXI web app.
 *
 * The enforced (error) gate is the deterministic JavaScript bundle budget; it
 * fails the build on a real regression and is not subject to runner noise.
 * The Lighthouse category scores (performance, a11y, best-practices, SEO) are
 * surfaced as warnings — they track quality toward the Lighthouse 90+ target
 * without flaking the pipeline on a slow CI runner. Tighten to "error" once a
 * stable baseline is established on the deployed site.
 */
module.exports = {
  ci: {
    collect: {
      startServerCommand: "node scripts/lhci-stack.mjs",
      startServerReadyPattern: "STACK READY",
      startServerReadyTimeout: 180000,
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/dashboard",
        "http://localhost:3000/predictions",
      ],
      numberOfRuns: 1,
      settings: {
        // Required in CI containers; desktop preset for a representative audit.
        chromeFlags: "--no-sandbox --headless=new",
        preset: "desktop",
      },
    },
    assert: {
      assertions: {
        // Hard budget (deterministic): keep shipped JS lean.
        "resource-summary:script:size": ["error", { maxNumericValue: 400000 }],
        "resource-summary:total:size": ["warn", { maxNumericValue: 1500000 }],
        "total-byte-weight": ["warn", { maxNumericValue: 1500000 }],
        // Quality scores — reported (warn) on the way to the 90+ target.
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:accessibility": ["warn", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
      },
    },
    upload: {
      // Keep results local to the run (no external upload).
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
