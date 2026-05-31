import { Test } from "@nestjs/testing";
import { DataModule } from "../../repositories/data.module";
import { AnalyticsService } from "../analytics/analytics.service";
import { LiveService } from "./live.service";

describe("LiveService", () => {
  let service: LiveService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DataModule],
      providers: [LiveService, AnalyticsService],
    }).compile();
    await moduleRef.init();
    service = moduleRef.get(LiveService);
  });

  it("advances minute and finishes at 90", () => {
    service.startNextMatch();
    let snap = service.snapshot();
    expect(snap.minute).toBe(0);
    for (let i = 0; i < 18; i++) snap = service.tick(() => 0.99); // no goals
    expect(snap.minute).toBe(90);
    expect(snap.status).toBe("FINISHED");
    expect(snap.homeGoals).toBe(0);
  });

  it("registers goals when the random draw is favourable", () => {
    service.startNextMatch();
    let snap = service.snapshot();
    for (let i = 0; i < 18; i++) snap = service.tick(() => 0.0); // always score
    expect(snap.homeGoals + snap.awayGoals).toBeGreaterThan(0);
    expect(snap.events.some((e) => e.type === "GOAL")).toBe(true);
  });

  it("keeps momentum within bounds", () => {
    service.startNextMatch();
    let snap = service.snapshot();
    for (let i = 0; i < 10; i++) snap = service.tick();
    expect(snap.momentum).toBeGreaterThanOrEqual(5);
    expect(snap.momentum).toBeLessThanOrEqual(95);
  });

  it("accumulates expected goals monotonically over the match", () => {
    service.startNextMatch();
    expect(service.snapshot().homeXg).toBe(0);
    let prevHome = 0;
    let prevAway = 0;
    let snap = service.snapshot();
    for (let i = 0; i < 18; i++) {
      snap = service.tick(() => 0.99); // no goals, xG still accrues
      expect(snap.homeXg).toBeGreaterThanOrEqual(prevHome);
      expect(snap.awayXg).toBeGreaterThanOrEqual(prevAway);
      prevHome = snap.homeXg;
      prevAway = snap.awayXg;
    }
    // Full match accrues a sensible total even with no goals scored.
    expect(snap.homeXg).toBeGreaterThan(0);
    expect(snap.homeXg + snap.awayXg).toBeLessThan(8);
  });

  it("resets expected goals when a new match starts", () => {
    service.startNextMatch();
    for (let i = 0; i < 5; i++) service.tick();
    const fresh = service.startNextMatch();
    expect(fresh.homeXg).toBe(0);
    expect(fresh.awayXg).toBe(0);
  });

  it("adds a discrete xG bump for each goal scored", () => {
    service.startNextMatch();
    let snap = service.snapshot();
    for (let i = 0; i < 18; i++) snap = service.tick(() => 0.0); // always score
    const goals = snap.homeGoals + snap.awayGoals;
    expect(goals).toBeGreaterThan(0);
    // Cumulative xG includes both continuous accrual and the per-goal bump,
    // so it must exceed the goals * the goal-chance xG floor.
    expect(snap.homeXg + snap.awayXg).toBeGreaterThan(goals * 0.35);
  });
});
