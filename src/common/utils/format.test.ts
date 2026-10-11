import { formatDistanceKm, formatDurationSec, formatFare } from "./format";

describe("format", () => {
  describe("formatFare", () => {
    it("writes the fare with thousands separators", () => {
      expect(formatFare(1750)).toBe("1,750원");
      expect(formatFare(650)).toBe("650원");
      expect(formatFare(12000)).toBe("12,000원");
    });

    it("handles zero, rounding and invalid input", () => {
      expect(formatFare(0)).toBe("0원");
      expect(formatFare(1749.6)).toBe("1,750원");
      expect(formatFare(-5)).toBe("0원");
      expect(formatFare(Number.NaN)).toBe("0원");
    });
  });

  describe("formatDurationSec", () => {
    it("rounds seconds to minutes and shows at least one minute", () => {
      expect(formatDurationSec(1470)).toBe("25분");
      expect(formatDurationSec(29)).toBe("1분");
      expect(formatDurationSec(90)).toBe("2분");
    });

    it("splits hours and minutes", () => {
      expect(formatDurationSec(3600)).toBe("1시간");
      expect(formatDurationSec(3900)).toBe("1시간 5분");
      expect(formatDurationSec(7380)).toBe("2시간 3분");
    });

    it("handles zero and invalid input", () => {
      expect(formatDurationSec(0)).toBe("0분");
      expect(formatDurationSec(-10)).toBe("0분");
      expect(formatDurationSec(Number.NaN)).toBe("0분");
    });
  });

  describe("formatDistanceKm", () => {
    it("uses meters below one kilometer and one decimal above", () => {
      expect(formatDistanceKm(0.8)).toBe("800m");
      expect(formatDistanceKm(0.0456)).toBe("46m");
      expect(formatDistanceKm(12.34)).toBe("12.3km");
      expect(formatDistanceKm(1)).toBe("1.0km");
    });

    it("handles zero and invalid input", () => {
      expect(formatDistanceKm(0)).toBe("0m");
      expect(formatDistanceKm(Number.NaN)).toBe("0m");
    });
  });
});
