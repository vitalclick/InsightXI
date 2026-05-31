import { Test } from "@nestjs/testing";
import { DataModule } from "../../repositories/data.module";
import { AnalyticsService } from "../analytics/analytics.service";
import { TacticalService } from "./tactical.service";

describe("TacticalService", () => {
  let service: TacticalService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DataModule],
      providers: [TacticalService, AnalyticsService],
    }).compile();
    await moduleRef.init();
    service = moduleRef.get(TacticalService);
  });

  it("produces a deterministic, well-formed profile", () => {
    const a = service.profile("mci");
    const b = service.profile("mci");
    expect(a).toEqual(b);
    expect(a.possession).toBeGreaterThanOrEqual(32);
    expect(a.possession).toBeLessThanOrEqual(70);
    expect(a.formation).toMatch(/^\d(-\d)+$/);
  });

  it("gives the stronger side a tactical edge and insights", () => {
    const m = service.matchup("mci", "bur");
    expect(m.tacticalEdge).toBeGreaterThan(0);
    expect(m.insights.length).toBeGreaterThan(0);
  });

  it("inverts the tactical edge when the teams are swapped", () => {
    const a = service.matchup("mci", "bur");
    const b = service.matchup("bur", "mci");
    expect(b.tacticalEdge).toBeLessThan(0);
    // Symmetric up to integer rounding of the half-weighted blend.
    expect(Math.abs(a.tacticalEdge + b.tacticalEdge)).toBeLessThanOrEqual(1);
  });
});
