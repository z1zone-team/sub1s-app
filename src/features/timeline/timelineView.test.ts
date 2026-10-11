import type { TravelLogItemDto } from "@/apis/queries/profile/getTimeline";
import {
  bucketLabel,
  chartBars,
  formatHoursMinutes,
  kstYearMonth,
  lineRows,
  logDateLabel,
  logSummary,
} from "./timelineView";

describe("kstYearMonth", () => {
  it("한국 시간 기준 연월을 돌려준다", () => {
    expect(kstYearMonth(Date.parse("2026-09-30T16:00:00Z"))).toEqual({ year: 2026, month: 10 });
    expect(kstYearMonth(Date.parse("2026-09-30T14:59:00Z"))).toEqual({ year: 2026, month: 9 });
  });
});

describe("bucketLabel", () => {
  it("기간마다 다른 라벨을 쓴다", () => {
    expect(bucketLabel("WEEK", "2026-10-11")).toBe("일");
    expect(bucketLabel("MONTH", "2026-10-05")).toBe("5");
    expect(bucketLabel("YEAR", "2026-10")).toBe("10");
    expect(bucketLabel("ALL", "2026")).toBe("2026");
  });
});

describe("chartBars", () => {
  it("가장 큰 막대를 1로 맞춘다", () => {
    const bars = chartBars("YEAR", [
      { key: "2026-09", distanceKm: 50, rideCount: 1 },
      { key: "2026-10", distanceKm: 100, rideCount: 2 },
    ]);
    expect(bars.map((bar) => [bar.label, bar.ratio])).toEqual([["9", 0.5], ["10", 1]]);
  });

  it("없으면 빈 목록이다", () => {
    expect(chartBars("ALL", undefined)).toEqual([]);
  });
});

describe("formatHoursMinutes", () => {
  it("시:분으로 보여 준다", () => {
    expect(formatHoursMinutes(6 * 3600 + 24 * 60)).toBe("6:24");
    expect(formatHoursMinutes(59 * 60)).toBe("0:59");
    expect(formatHoursMinutes(0)).toBe("0:00");
  });
});

describe("lineRows", () => {
  it("거리가 큰 호선부터 호선 이름과 비율을 붙인다", () => {
    const rows = lineRows([
      { lineId: "03", distanceKm: 13.5 },
      { lineId: "09", distanceKm: 27 },
    ]);
    expect(rows.map((row) => [row.name, row.ratio])).toEqual([["9호선", 1], ["3호선", 0.5]]);
  });

  it("없으면 빈 목록이다", () => {
    expect(lineRows(undefined)).toEqual([]);
  });
});

describe("이동 기록 행", () => {
  const log: TravelLogItemDto = {
    id: "1",
    originStationName: "가양",
    destStationName: "신논현",
    distanceKm: 14.6,
    traveledAt: "2026-10-06T08:00:00+09:00",
    lineIds: ["09"],
    isExpress: true,
    durationSec: 1440,
  };

  it("날짜와 요일을 보여 준다", () => {
    expect(logDateLabel(log.traveledAt)).toBe("10.06 화");
    expect(logDateLabel("bad")).toBe("");
  });

  it("호선과 급행, 탑승 시간을 보여 준다", () => {
    expect(logSummary(log)).toBe("9호선 급행 · 24분");
    expect(logSummary({ ...log, isExpress: false, lineIds: ["09", "03"], durationSec: 20 })).toBe("9호선 → 3호선 · 1분");
  });
});
