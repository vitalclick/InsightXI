import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Sidebar } from "./sidebar";
import { useUiStore } from "../../store/ui-store";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn() }),
}));

beforeEach(() => {
  // Reset shared UI store between tests.
  useUiStore.setState({ collapsed: false, mobileOpen: false });
});

describe("Sidebar collapsed tooltips", () => {
  it("shows a tooltip with the item label on hover when collapsed", () => {
    useUiStore.setState({ collapsed: true });
    render(<Sidebar />);

    // No tooltip until the user interacts.
    expect(screen.queryByRole("tooltip")).toBeNull();

    fireEvent.mouseEnter(screen.getByRole("link", { name: "Fixtures" }));

    const tip = screen.getByRole("tooltip");
    expect(tip).toHaveTextContent("Fixtures");

    fireEvent.mouseLeave(screen.getByRole("link", { name: "Fixtures" }));
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("surfaces the tooltip on keyboard focus too", () => {
    useUiStore.setState({ collapsed: true });
    render(<Sidebar />);

    fireEvent.focus(screen.getByRole("link", { name: "Historical" }));
    expect(screen.getByRole("tooltip")).toHaveTextContent("Historical");
  });

  it("does NOT show a tooltip when the sidebar is expanded (labels visible)", () => {
    useUiStore.setState({ collapsed: false });
    render(<Sidebar />);

    fireEvent.mouseEnter(screen.getByRole("link", { name: "Fixtures" }));
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("keeps an accessible name on every nav item even when collapsed", () => {
    useUiStore.setState({ collapsed: true });
    render(<Sidebar />);

    // aria-label backstops the visually-hidden <span> labels in the icon rail.
    for (const label of ["Home", "Fixtures", "Historical", "Upgrade Premium"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });
});
