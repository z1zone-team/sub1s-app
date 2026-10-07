import { linking } from "./linking";

describe("Deep Linking Configuration", () => {
  it("should have correct scheme prefixes", () => {
    expect(linking.prefixes).toContain("sub1s://");
    expect(linking.prefixes).toContain("https://sub1s.com");
  });

  it("should have correct screen path mappings", () => {
    const screens = linking.config?.screens as any;
    expect(screens).toBeDefined();

    // MainTabs mappings
    expect(screens.MainTabs.screens.HomeTab).toBe("home");
    expect(screens.MainTabs.screens.RankingTab).toBe("ranking");
    expect(screens.MainTabs.screens.ProfileTab).toBe("profile");

    // Stack mappings
    expect(screens.RouteResult).toBe("route");
    expect(screens.LiveNav).toBe("livenav/:sessionId");
    expect(screens.Timeline).toBe("timeline");
  });
});
