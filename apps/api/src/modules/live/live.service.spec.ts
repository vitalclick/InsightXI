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
});
