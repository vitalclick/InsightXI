import { render, screen } from "@testing-library/react";
import { Sidebar } from "./sidebar";
import { useUiStore } from "../../store/ui-store";

jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: jest.fn() }),
}));

beforeEach(() => {
  // Reset the shared UI store between tests.
  useUiStore.setState({ collapsed: false, mobileOpen: false });
});

describe("Sidebar collapsed tooltips", () => {
  it("gives every icon a native title tooltip when collapsed", () => {
    useUiStore.setState({ collapsed: true });
    render(<Sidebar />);

    for (const label of ["Home", "Fixtures", "Live Center", "Historical", "Upgrade Premium"]) {
      const link = screen.getByRole("link", { name: label });
      expect(link).toHaveAttribute("title", label);
    }
  });

  it("drops the title when expanded (labels are already visible)", () => {
    useUiStore.setState({ collapsed: false });
    render(<Sidebar />);

    const link = screen.getByRole("link", { name: "Fixtures" });
    expect(link).not.toHaveAttribute("title");
  });

  it("keeps an accessible name on every nav item in both states", () => {
    for (const collapsed of [true, false]) {
      useUiStore.setState({ collapsed });
      const { unmount } = render(<Sidebar />);
      for (const label of ["Home", "Fixtures", "Live Center", "Historical", "Upgrade Premium"]) {
        // aria-label backstops the visually-hidden <span> labels in the icon rail.
        expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
      }
      unmount();
    }
  });
});
