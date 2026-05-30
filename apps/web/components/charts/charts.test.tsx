import { render } from "@testing-library/react";
import { ProbabilityRing } from "./probability-ring";
import { Sparkline } from "./sparkline";
import { MomentumGauge } from "./momentum-gauge";

describe("chart components render", () => {
  it("ProbabilityRing draws an arc per datum plus the track and exposes a label", () => {
    const { container } = render(
      <ProbabilityRing
        data={[
          { label: "Home win", value: 0.5, color: "#22c55e" },
          { label: "Draw", value: 0.3, color: "#fff" },
          { label: "Away win", value: 0.2, color: "#3b82f6" },
        ]}
        centerValue="50%"
      />,
    );
    // 1 background track + 3 segments.
    expect(container.querySelectorAll("circle")).toHaveLength(4);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-label")).toContain("Home win 50%");
  });

  it("Sparkline renders a polyline for the series", () => {
    const { container } = render(<Sparkline values={[1, 3, 2, 5]} />);
    expect(container.querySelector("polyline")).toBeInTheDocument();
  });

  it("Sparkline renders nothing for an empty series", () => {
    const { container } = render(<Sparkline values={[]} />);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("MomentumGauge labels the dominant side", () => {
    const { getByText, rerender } = render(
      <MomentumGauge momentum={70} homeName="Arsenal" awayName="Spurs" />,
    );
    expect(getByText("Arsenal pressure")).toBeInTheDocument();
    rerender(<MomentumGauge momentum={30} homeName="Arsenal" awayName="Spurs" />);
    expect(getByText("Spurs pressure")).toBeInTheDocument();
  });
});
