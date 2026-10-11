import {
  formatClockKst,
  formatDistanceKm,
  formatDurationSec,
  formatFare,
  formatMonthDayKst,
} from "./format";

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

  describe("formatMonthDayKst", () => {
    it("writes the month and day in Korean time", () => {
      expect(formatMonthDayKst("2026-10-06T03:00:00.000Z")).toBe("10.06");
    });

    it("rolls over to the next day after 15:00 UTC, which is midnight in Korea", () => {
      expect(formatMonthDayKst("2026-10-06T14:59:59.000Z")).toBe("10.06");
      expect(formatMonthDayKst("2026-10-06T15:00:00.000Z")).toBe("10.07");
    });

    it("crosses a year boundary and accepts an explicit offset", () => {
      expect(formatMonthDayKst("2026-12-31T15:30:00.000Z")).toBe("01.01");
      expect(formatMonthDayKst("2026-10-06T23:30:00+09:00")).toBe("10.06");
    });

    it("returns an empty string for an invalid value", () => {
      expect(formatMonthDayKst("not-a-date")).toBe("");
    });
  });

  describe("formatClockKst", () => {
    it("writes the time in 12-hour Korean style regardless of the offset in the input", () => {
      expect(formatClockKst("2026-10-11T14:17:00.000+09:00")).toBe("오후 2:17");
      expect(formatClockKst("2026-10-11T05:17:00.000Z")).toBe("오후 2:17");
      expect(formatClockKst(Date.parse("2026-10-11T09:05:00+09:00"))).toBe("오전 9:05");
    });

    it("uses 12 for noon and midnight", () => {
      expect(formatClockKst("2026-10-11T12:00:00+09:00")).toBe("오후 12:00");
      expect(formatClockKst("2026-10-11T00:00:00+09:00")).toBe("오전 12:00");
    });

    it("returns an empty string for an invalid value", () => {
      expect(formatClockKst("nope")).toBe("");
    });
  });
});
