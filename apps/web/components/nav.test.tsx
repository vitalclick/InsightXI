import { render, screen, fireEvent } from "@testing-library/react";
import { Nav } from "./nav";
import * as pwaHook from "../hooks/use-pwa-install";

function mockInstall(state: Partial<pwaHook.PwaInstallState>) {
  jest.spyOn(pwaHook, "usePwaInstall").mockReturnValue({
    platform: "desktop",
    isMobile: false,
    installed: false,
    canPrompt: false,
    promptInstall: async () => false,
    ...state,
  });
}

describe("Nav", () => {
  beforeAll(() => {
    // jsdom lacks matchMedia; the Nav effect uses it.
    window.matchMedia = ((q: string) => ({
      matches: false,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
  });

  afterEach(() => jest.restoreAllMocks());

  it("does not show Install in the menu on desktop", () => {
    mockInstall({ isMobile: false });
    render(<Nav />);
    fireEvent.click(screen.getByLabelText("Toggle menu"));
    expect(screen.queryByText("Install app")).not.toBeInTheDocument();
  });

  it("shows Install in the menu on mobile when not installed", () => {
    mockInstall({ isMobile: true, installed: false, platform: "android" });
    render(<Nav />);
    fireEvent.click(screen.getByLabelText("Toggle menu"));
    const link = screen.getByText("Install app").closest("a");
    expect(link).toHaveAttribute("href", "/install");
  });

  it("hides Install once the app is installed", () => {
    mockInstall({ isMobile: true, installed: true, platform: "android" });
    render(<Nav />);
    fireEvent.click(screen.getByLabelText("Toggle menu"));
    expect(screen.queryByText("Install app")).not.toBeInTheDocument();
  });
});
