import { checkAuthGateAccess } from "./AuthGate";

describe("AuthGate Access Logic", () => {
  it("should return LOADING when auth is not yet loaded", () => {
    const status = checkAuthGateAccess(false, false);
    expect(status).toBe("LOADING");
  });

  it("should return UNAUTHENTICATED when loaded but not signed in", () => {
    const status = checkAuthGateAccess(true, false);
    expect(status).toBe("UNAUTHENTICATED");
  });

  it("should return AUTHENTICATED when loaded and signed in", () => {
    const status = checkAuthGateAccess(true, true);
    expect(status).toBe("AUTHENTICATED");
  });
});
