import { Test } from "@nestjs/testing";
import { StandingsService } from "./standings.service";
import { DataModule } from "../../repositories/data.module";
import { FootballRepository } from "../../repositories/football.repository";

describe("StandingsService", () => {
  let service: StandingsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DataModule],
      providers: [StandingsService],
    }).compile();
    await moduleRef.init(); // trigger repository onModuleInit
    service = moduleRef.get(StandingsService);
    // ensure repo loaded
    moduleRef.get(FootballRepository);
  });

  it("produces a consistent, fully-ranked table", () => {
    const table = service.table("epl", "2024/25");
    expect(table).toHaveLength(8);
    // Positions are 1..8 with no gaps.
    expect(table.map((r) => r.position)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    // Points are non-increasing down the table.
    for (let i = 1; i < table.length; i++) {
      expect(table[i - 1].points).toBeGreaterThanOrEqual(table[i].points);
    }
  });

  it("keeps wins+draws+losses equal to games played", () => {
    const table = service.table("laliga", "2024/25");
    for (const row of table) {
      expect(row.won + row.drawn + row.lost).toBe(row.played);
    }
  });
});
