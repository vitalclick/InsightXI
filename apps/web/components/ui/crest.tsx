import { clubCode, clubColors } from "../../lib/club";

type CrestSize = "xs" | "sm" | "md" | "lg" | "xl";

/** Geometric club crest (gradient + code), deterministic from the seed. */
export function Crest({
  name,
  shortName,
  seed,
  size = "sm",
}: {
  name: string;
  shortName?: string;
  /** Stable seed for the gradient (defaults to the team id/name). */
  seed?: string;
  size?: CrestSize;
}) {
  const { c1, c2 } = clubColors(seed ?? name);
  const code = clubCode(name, shortName);
  return (
    <div className={`crest ${size}`} style={{ background: `linear-gradient(150deg,${c1},${c2})` }} aria-hidden>
      {code}
    </div>
  );
}
