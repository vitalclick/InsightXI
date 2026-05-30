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
    useAuthStore
      .getState()
      .setAuth("jwt-123", { id: "u1", email: "a@b.dev", tier: "PREMIUM" });

    let state = useAuthStore.getState();
    expect(state.token).toBe("jwt-123");
    expect(state.user?.tier).toBe("PREMIUM");

    state.logout();
    state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });
});
