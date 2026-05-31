import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { Crest } from "./ui/crest";
import { FormDots } from "./ui/form-dots";
import { PageHead } from "./ui/page-head";
import { SkeletonRows, SkeletonCards } from "./ui/skeleton";
import { ProbSplit } from "./match/prob-split";
import { ScoreMatrix } from "./match/score-matrix";

// jest-axe's matcher is registered here rather than via a global to keep the
// existing setup file untouched.
import { toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

async function expectNoViolations(ui: React.ReactElement) {
  const { container } = render(ui);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}

describe("accessibility (axe)", () => {
  it("Crest has no violations", async () => {
    await expectNoViolations(<Crest name="Riverside FC" seed="rvs" />);
  });

  it("FormDots has no violations", async () => {
    await expectNoViolations(<FormDots form={["W", "D", "L", "W", "W"]} />);
  });

  it("PageHead has no violations", async () => {
    await expectNoViolations(<PageHead eyebrow="Section" title="Title" sub="Subtitle text" />);
  });

  it("SkeletonRows / SkeletonCards have no violations", async () => {
    await expectNoViolations(
      <>
        <SkeletonRows rows={3} />
        <SkeletonCards count={3} />
      </>,
    );
  });

  it("ProbSplit has no violations", async () => {
    await expectNoViolations(<ProbSplit home={0.5} draw={0.25} away={0.25} />);
  });

  it("ScoreMatrix has no violations", async () => {
    await expectNoViolations(
      <ScoreMatrix homeCode="RVS" awayCode="KGT" lambdaHome={1.8} lambdaAway={1.1} />,
    );
  });
});
