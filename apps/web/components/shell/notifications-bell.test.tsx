import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationsBell } from "./notifications-bell";
import { useAuthStore } from "../../store/auth-store";

function renderBell() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <NotificationsBell />
    </QueryClientProvider>,
  );
}

describe("NotificationsBell", () => {
  afterEach(() => useAuthStore.getState().logout());

  it("renders a plain sign-in link when logged out", () => {
    useAuthStore.getState().logout();
    renderBell();
    const link = screen.getByLabelText("Notifications");
    expect(link.getAttribute("href")).toBe("/account");
  });

  it("renders a toggle button when authenticated", () => {
    useAuthStore.getState().setAuth(
      "tok",
      {
        id: "u1",
        email: "a@b.dev",
        tier: "FREE",
        role: "USER",
        suspended: false,
        name: null,
        avatarUrl: null,
        provider: "email",
        emailVerified: true,
        subscriptionStatus: "none",
        currentPeriodEnd: null,
      },
      "refresh",
    );
    renderBell();
    // Authenticated bell is a button (opens the dropdown), not a link.
    expect(screen.getByRole("button", { name: /Notifications/ })).toBeInTheDocument();
  });
});
