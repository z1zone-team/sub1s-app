import { useAuthStore } from "./auth-store";

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it("should have initial unauthenticated state", () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it("should set authenticated user and token", () => {
    const mockUser = {
      id: "u-123",
      clerkId: "clerk_123",
      email: "user@sub1s.com",
      nickname: "홍길동",
      totalDistanceMeters: 5000,
      currentStreakDays: 2,
      rankScore: 300,
    };

    useAuthStore.getState().setAuth(mockUser, "jwt-token-sample");

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe("jwt-token-sample");
  });

  it("should clear auth on logout", () => {
    useAuthStore.getState().setAuth(
      {
        id: "u-123",
        clerkId: "clerk_123",
        email: "user@sub1s.com",
        nickname: "홍길동",
        totalDistanceMeters: 5000,
        currentStreakDays: 2,
        rankScore: 300,
      },
      "token"
    );

    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it("should enable and disable mock mode correctly", () => {
    useAuthStore.getState().enableMockMode();

    let state = useAuthStore.getState();
    expect(state.isMockMode).toBe(true);
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.nickname).toBe("테스트유저");

    useAuthStore.getState().disableMockMode();
    state = useAuthStore.getState();
    expect(state.isMockMode).toBe(false);
    expect(state.isAuthenticated).toBe(false);
  });
});
