import { buildBatchInsert, chunkRows } from "./batch";

describe("buildBatchInsert", () => {
  it("numbers placeholders sequentially across rows", () => {
    const { placeholders, values } = buildBatchInsert([
      ["a", "b"],
      ["c", "d"],
    ]);
    expect(placeholders).toBe("($1,$2),($3,$4)");
    expect(values).toEqual(["a", "b", "c", "d"]);
  });

  it("handles a single row", () => {
    const { placeholders, values } = buildBatchInsert([[1, 2, 3]]);
    expect(placeholders).toBe("($1,$2,$3)");
    expect(values).toEqual([1, 2, 3]);
  });
});

describe("chunkRows", () => {
  it("keeps each chunk under the parameter budget", () => {
    const rows = Array.from({ length: 25 }, (_, i) => i);
    const chunks = chunkRows(rows, 12, 120); // 120/12 = 10 rows per chunk
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(10);
    expect(chunks[2]).toHaveLength(5);
  });

  it("returns a single chunk when rows fit", () => {
    expect(chunkRows([1, 2, 3], 12)).toEqual([[1, 2, 3]]);
  });

  it("never produces empty chunks for a huge column count", () => {
    const chunks = chunkRows([1, 2, 3], 999999);
    expect(chunks.every((c) => c.length >= 1)).toBe(true);
  });
});
