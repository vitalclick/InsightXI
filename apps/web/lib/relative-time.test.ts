import { timeAgo } from "./relative-time";

describe("timeAgo", () => {
  const now = new Date("2026-05-31T12:00:00.000Z").getTime();
  const at = (iso: string) => timeAgo(iso, now);

  it("renders recent times", () => {
    expect(at("2026-05-31T11:59:40.000Z")).toBe("just now");
    expect(at("2026-05-31T11:45:00.000Z")).toBe("15m ago");
  });

  it("renders hours and days", () => {
    expect(at("2026-05-31T09:00:00.000Z")).toBe("3h ago");
    expect(at("2026-05-29T12:00:00.000Z")).toBe("2d ago");
  });

  it("returns empty string for an invalid date", () => {
    expect(at("not-a-date")).toBe("");
  });
});
