import { render, screen } from "@testing-library/react";
import { FormBadges } from "./form-badges";

describe("FormBadges", () => {
  it("renders a badge per result", () => {
    render(<FormBadges form={["W", "D", "L"]} />);
    expect(screen.getByText("W")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
    expect(screen.getByText("L")).toBeInTheDocument();
  });

  it("renders an em dash when there is no form", () => {
    render(<FormBadges form={[]} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
