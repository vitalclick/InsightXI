/** Poisson correct-score modelling shared by the premium and match pages. */

export interface ScoreCell {
  h: number;
  a: number;
  prob: number;
}

export interface ScoreMatrix {
  cells: ScoreCell[];
  best: ScoreCell;
  max: number;
  /** Aggregated outcome probabilities implied by the matrix. */
  homeWin: number;
  draw: number;
  awayWin: number;
  size: number;
}

export function poissonPmf(k: number, lambda: number): number {
  let fact = 1;
  for (let i = 2; i <= k; i++) fact *= i;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / fact;
}

/** Joint scoreline grid (0..size) from each side's expected goals. */
export function scoreMatrix(lambdaHome: number, lambdaAway: number, size = 4): ScoreMatrix {
  const cells: ScoreCell[] = [];
  let best: ScoreCell = { h: 0, a: 0, prob: 0 };
  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;
  for (let h = 0; h <= size; h++) {
    for (let a = 0; a <= size; a++) {
      const prob = poissonPmf(h, lambdaHome) * poissonPmf(a, lambdaAway);
      cells.push({ h, a, prob });
      if (prob > best.prob) best = { h, a, prob };
      if (h > a) homeWin += prob;
      else if (h === a) draw += prob;
      else awayWin += prob;
    }
  }
  const max = Math.max(...cells.map((c) => c.prob));
  return { cells, best, max, homeWin, draw, awayWin, size };
}
