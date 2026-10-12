import { LINES, getLineInfo, lineTextColor } from "./lines";
import { congestionColor, levelOfRate } from "./congestion";
import { palettes } from "./palette";
import { resolveScheme } from "./useTheme";

describe("theme", () => {
  describe("palettes", () => {
    it("keeps the prototype brand colors in the light palette", () => {
      expect(palettes.light.primary).toBe("#002968");
      expect(palettes.light.bg).toBe("#FFFFFF");
      expect(palettes.light.surface).toBe("#F2F4F6");
      expect(palettes.light.error).toBe("#F04452");
    });

    it("overrides only the surfaces and text in the dark palette", () => {
      expect(palettes.dark.bg).toBe("#0B1220");
      expect(palettes.dark.primary).toBe("#5B8DEF");
      expect(palettes.dark.success).toBe(palettes.light.success);
      expect(Object.keys(palettes.dark)).toEqual(Object.keys(palettes.light));
    });
  });

  describe("resolveScheme", () => {
    it("follows a dark system setting and falls back to light otherwise", () => {
      expect(resolveScheme("dark")).toBe("dark");
      expect(resolveScheme("light")).toBe("light");
      expect(resolveScheme(null)).toBe("light");
      expect(resolveScheme(undefined)).toBe("light");
    });
  });

  describe("lines", () => {
    it("covers the 24 line ids the server returns", () => {
      const serverLineIds = [
        "01", "02", "03", "04", "05", "06", "07", "08", "09",
        "AR", "EV", "GA", "GC", "GG", "GJ", "GM", "I1", "I2",
        "SB", "SD", "SH", "SL", "UI", "UJ",
      ];

      expect(Object.keys(LINES).sort()).toEqual([...serverLineIds].sort());
    });

    it("uses the same key as the id inside every entry", () => {
      for (const [key, line] of Object.entries(LINES)) expect(line.id).toBe(key);
    });

    it("gives every line a hex color and a short label that fits a badge", () => {
      for (const line of Object.values(LINES)) {
        expect(line.color).toMatch(/^#[0-9A-F]{6}$/);
        expect(line.shortLabel.length).toBeGreaterThan(0);
        expect(line.shortLabel.length).toBeLessThanOrEqual(5);
      }
    });

    it("resolves a known line and falls back to a neutral badge for an unknown one", () => {
      expect(getLineInfo("09")).toMatchObject({ name: "9호선", shortLabel: "9" });
      expect(getLineInfo("SB")).toMatchObject({ name: "신분당선", color: "#D4003B" });
      expect(getLineInfo("ZZ")).toEqual({
        id: "ZZ",
        name: "ZZ",
        shortLabel: "ZZ",
        color: "#B0B8C1",
      });
    });

    it("uses dark text on the light line colors and white text on the dark ones", () => {
      expect(lineTextColor(LINES["09"].color)).toBe("#191F28");
      expect(lineTextColor(LINES.SD.color)).toBe("#191F28");
      expect(lineTextColor(LINES.UI.color)).toBe("#191F28");
      expect(lineTextColor(LINES["01"].color)).toBe("#FFFFFF");
      expect(lineTextColor(LINES.SB.color)).toBe("#FFFFFF");
      expect(lineTextColor(LINES["02"].color)).toBe("#FFFFFF");
    });
  });

  describe("congestion", () => {
    it("maps a rate to the same level the server uses", () => {
      expect(levelOfRate(0)).toBe("여유");
      expect(levelOfRate(34)).toBe("여유");
      expect(levelOfRate(35)).toBe("보통");
      expect(levelOfRate(70)).toBe("보통");
      expect(levelOfRate(71)).toBe("혼잡");
      expect(levelOfRate(100)).toBe("혼잡");
    });

    it("colors each level with a status color of the palette", () => {
      expect(congestionColor("여유", palettes.light)).toBe(palettes.light.success);
      expect(congestionColor("보통", palettes.light)).toBe(palettes.light.warning);
      expect(congestionColor("혼잡", palettes.dark)).toBe(palettes.dark.error);
    });
  });
});
