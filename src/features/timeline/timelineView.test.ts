import type { TravelLogItemDto } from "@/apis/queries/profile/getTimeline";
import {
  axisTicks,
  kstDateKey,
  bucketLabel,
  chartBars,
  formatHoursMinutes,
  kstYearMonth,
  lineRows,
  logDateLabel,
  logIsHighlighted,
  logMatchesLine,
  logsForPeriod,
  logSummary,
  periodName,
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

describe("periodName", () => {
  const now = Date.parse("2026-09-15T03:00:00Z");
  it("기간마다 이름이 다르다", () => {
    expect(periodName("WEEK", now)).toBe("이번 주");
    expect(periodName("MONTH", now)).toBe("9월");
    expect(periodName("YEAR", now)).toBe("2026년");
    expect(periodName("ALL", now)).toBe("전체 기간");
  });
});

describe("axisTicks", () => {
  it("프로토타입의 눈금과 같다", () => {
    expect(axisTicks(11.5)).toEqual({ max: 12, ticks: [12, 8, 4, 0] });
    expect(axisTicks(25.5)).toEqual({ max: 30, ticks: [30, 20, 10, 0] });
    expect(axisTicks(96.3)).toEqual({ max: 120, ticks: [120, 80, 40, 0] });
  });

  it("최대값이 눈금 안에 들어간다", () => {
    for (const km of [0.4, 3, 7.9, 14.6, 74.6, 300, 1234]) {
      expect(axisTicks(km).max).toBeGreaterThanOrEqual(km);
    }
  });

  it("기록이 없으면 기본 눈금이다", () => {
    expect(axisTicks(0)).toEqual({ max: 3, ticks: [3, 2, 1, 0] });
  });
});

describe("logsForPeriod", () => {
  const log = (id: string, traveledAt: string, lineIds: string[] = ["09"]) =>
    ({ id, traveledAt, lineIds, originStationName: "a", destStationName: "b", distanceKm: 1, isExpress: false, durationSec: 60 }) as TravelLogItemDto;
  const logs = [log("a", "2026-10-12T08:00:00+09:00"), log("b", "2026-10-05T08:00:00+09:00"), log("c", "2026-10-02T23:30:00+09:00")];
  const week = [
    { key: "2026-10-06", distanceKm: 0, rideCount: 0 },
    { key: "2026-10-12", distanceKm: 0, rideCount: 0 },
  ];

  it("한국 날짜로 바꾼다", () => {
    expect(kstDateKey("2026-10-02T23:30:00+09:00")).toBe("2026-10-02");
    expect(kstDateKey("2026-10-02T15:30:00Z")).toBe("2026-10-03");
    expect(kstDateKey("bad")).toBe("");
  });

  it("주는 막대 날짜 범위 안의 기록만 남긴다", () => {
    expect(logsForPeriod(logs, "WEEK", week).map((item) => item.id)).toEqual(["a"]);
  });

  it("년과 전체는 그대로 둔다", () => {
    expect(logsForPeriod(logs, "YEAR", week)).toHaveLength(3);
    expect(logsForPeriod(logs, "WEEK", undefined)).toHaveLength(3);
  });

  it("호선을 고르면 그 호선을 탄 기록만 맞는다", () => {
    const transfer = log("t", "2026-10-12T08:00:00+09:00", ["09", "03"]);
    expect(logMatchesLine(transfer, "03")).toBe(true);
    expect(logMatchesLine(transfer, "02")).toBe(false);
    expect(logMatchesLine(transfer, undefined)).toBe(true);
  });
});

describe("logIsHighlighted", () => {
  const log = (id: string, lineIds: string[]): TravelLogItemDto => ({
    id,
    originStationName: "가양",
    destStationName: "신논현",
    distanceKm: 1,
    traveledAt: "2026-10-06T08:00:00+09:00",
    lineIds,
    isExpress: false,
    durationSec: 60,
  });

  it("이동을 골랐으면 그 이동만 또렷하다", () => {
    expect(logIsHighlighted(log("a", ["09"]), "a", undefined)).toBe(true);
    expect(logIsHighlighted(log("b", ["09"]), "a", undefined)).toBe(false);
  });

  it("이동을 골랐으면 호선 필터보다 우선한다", () => {
    expect(logIsHighlighted(log("a", ["03"]), "a", "09")).toBe(true);
    expect(logIsHighlighted(log("b", ["09"]), "a", "09")).toBe(false);
  });

  it("이동을 고르지 않았으면 호선 필터를 따른다", () => {
    expect(logIsHighlighted(log("a", ["09"]), undefined, "09")).toBe(true);
    expect(logIsHighlighted(log("a", ["03"]), undefined, "09")).toBe(false);
    expect(logIsHighlighted(log("a", ["03"]), undefined, undefined)).toBe(true);
  });
});
