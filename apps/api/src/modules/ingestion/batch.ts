/**
 * Build a multi-row INSERT VALUES clause and the flat parameter array for
 * node-postgres. Turns N single-row upserts into one batched statement, which
 * collapses per-row network round trips (the dominant cost when the DB is in a
 * different region/host than the API).
 *
 * Postgres caps bound parameters at 65535, so callers chunk rows accordingly.
 */
export interface BatchInsert {
  /** e.g. "($1,$2,$3),($4,$5,$6)" */
  placeholders: string;
  /** Flattened values aligned with the placeholders. */
  values: unknown[];
}

export function buildBatchInsert(rows: unknown[][]): BatchInsert {
  const values: unknown[] = [];
  const groups: string[] = [];
  let p = 0;
  for (const row of rows) {
    const slots = row.map(() => `$${++p}`);
    groups.push(`(${slots.join(",")})`);
    values.push(...row);
  }
  return { placeholders: groups.join(","), values };
}

/** Split rows into chunks so each statement stays under the param limit. */
export function chunkRows<T>(rows: T[], colsPerRow: number, maxParams = 60000): T[][] {
  const perChunk = Math.max(1, Math.floor(maxParams / Math.max(1, colsPerRow)));
  const chunks: T[][] = [];
  for (let i = 0; i < rows.length; i += perChunk) {
    chunks.push(rows.slice(i, i + perChunk));
  }
  return chunks;
}
