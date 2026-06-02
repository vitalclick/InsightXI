import { useAuthStore } from "./auth-store";

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it("starts logged out", () => {
    const { token, user } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(user).toBeNull();
  });

  it("stores auth on setAuth and clears on logout", () => {
    useAuthStore.getState().setAuth(
      "jwt-123",
      {
        id: "u1",
        email: "a@b.dev",
        tier: "PREMIUM",
        role: "USER",
        suspended: false,
        name: null,
        avatarUrl: null,
        provider: "email",
        emailVerified: true,
        subscriptionStatus: "active",
        currentPeriodEnd: null,
      },
      "refresh-456",
    );

    let state = useAuthStore.getState();
    expect(state.token).toBe("jwt-123");
    expect(state.refreshToken).toBe("refresh-456");
    expect(state.user?.tier).toBe("PREMIUM");

    state.logout();
    state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
  });
});
