import { linking } from "./linking";

describe("Deep Linking Configuration", () => {
  it("should have correct scheme prefixes", () => {
    expect(linking.prefixes).toContain("sub1s-local://");
    expect(linking.prefixes).not.toContain("sub1s://");
    expect(linking.prefixes).toContain("https://sub1s.devnoco.com");
  });

  it("should have correct screen path mappings", () => {
    const screens = linking.config?.screens as any;
    expect(screens).toBeDefined();

    // MainTabs mappings
    expect(screens.MainTabs.screens.HomeTab).toBe("home");
    expect(screens.MainTabs.screens.RankingTab).toBe("ranking");
    expect(screens.MainTabs.screens.ProfileTab).toBe("profile");

    // Stack mappings
    expect(screens.Search).toBe("search");
    expect(screens.RouteResult.path).toBe("route");
    expect(screens.LiveNav).toBe("livenav/:sessionId");
    expect(screens.Timeline).toBe("timeline");
    expect(screens.Invite).toBe("invite/:token");
  });

  describe("route deep link", () => {
    const routeConfig = () =>
      (linking.config?.screens as any).RouteResult as {
        parse: Record<string, (value: string) => unknown>;
        stringify: Record<string, (value: any) => string>;
      };

    it("reads the origin and destination query values as station ids", () => {
      const { parse } = routeConfig();

      expect(parse.origin("09_907")).toEqual({ name: "", stationId: "09_907" });
      expect(parse.destination("02_222")).toEqual({ name: "", stationId: "02_222" });
    });

    it("writes a station endpoint back as its id", () => {
      const { stringify } = routeConfig();

      expect(stringify.origin({ name: "가양", stationId: "09_907" })).toBe("09_907");
    });
  });
});
