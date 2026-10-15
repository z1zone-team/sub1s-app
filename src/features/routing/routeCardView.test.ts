import type { PathSegmentDto, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import {
  alightInfo,
  departureLabel,
  endpointLabel,
  firstRideCars,
  overallCongestion,
  pillSegments,
  separateFareLineNames,
  splitDuration,
  waitingText,
  weakAcCarNumbers,
} from "./routeCardView";

const segment = (over: Partial<PathSegmentDto>): PathSegmentDto => ({
  lineId: "09",
  direction: "UP",
  isExpress: false,
  fromStationId: "09_907",
  fromStationName: "가양",
  toStationId: "09_925",
  toStationName: "신논현",
  stationCount: 10,
  durationSec: 1440,
  distanceKm: 17,
  recommendedCarNo: 3,
  isWeakAirConditioned: false,
  congestionLevel: "보통",
  congestionRate: 50,
  operationStatus: "NORMAL",
  ...over,
});

const walk = (durationSec: number, toStationName = "강남역"): PathSegmentDto =>
  segment({ lineId: "WALK", direction: "NONE", durationSec, toStationName, recommendedCarNo: 0 });

const option = (segments: PathSegmentDto[]): SubwayRouteOptionDto => ({
  mode: "OPTIMAL",
  totalDurationSec: segments.reduce((sum, s) => sum + s.durationSec, 0),
  totalDistanceKm: 17,
  totalFare: 1750,
  transferCount: 0,
  estimatedArrivalTimestamp: "2026-10-12T05:51:00.000Z",
  segments,
  highlights: [],
  operationStatus: "NORMAL",
});

describe("endpointLabel", () => {
  it("지하철역에는 역을 붙이고 이미 붙어 있으면 그대로 둔다", () => {
    expect(endpointLabel({ name: "가양", stationId: "09_907" })).toBe("가양역");
    expect(endpointLabel({ name: "서울역", stationId: "01_133" })).toBe("서울역");
  });

  it("장소와 현재 위치는 이름 그대로 쓴다", () => {
    expect(endpointLabel({ name: "현재 위치", lat: 37.5, lng: 126.8 })).toBe("현재 위치");
  });
});

describe("departureLabel", () => {
  it("한국 시간 24시간제로 오늘 출발을 쓴다", () => {
    expect(departureLabel(Date.parse("2026-10-12T05:17:00.000Z"))).toBe("오늘 14:17 출발");
  });
});

describe("splitDuration", () => {
  it("시간과 분으로 나눈다", () => {
    expect(splitDuration(4920)).toEqual({ hours: 1, minutes: 22 });
    expect(splitDuration(2040)).toEqual({ hours: 0, minutes: 34 });
  });

  it("1분 미만은 1분으로, 잘못된 값은 0으로 본다", () => {
    expect(splitDuration(20)).toEqual({ hours: 0, minutes: 1 });
    expect(splitDuration(Number.NaN)).toEqual({ hours: 0, minutes: 0 });
  });
});

describe("overallCongestion", () => {
  it("탑승 구간만 소요 시간으로 가중 평균한다", () => {
    const result = overallCongestion(
      option([segment({ durationSec: 1800, congestionRate: 40 }), segment({ durationSec: 600, congestionRate: 80 }), walk(480)])
    );
    expect(result).toEqual({ level: "보통", ratePercent: 50, estimated: false });
  });

  it("단계는 서버와 같은 기준이다 (35 미만 여유, 70 초과 혼잡)", () => {
    expect(overallCongestion(option([segment({ congestionRate: 30 })]))?.level).toBe("여유");
    expect(overallCongestion(option([segment({ congestionRate: 78 })]))?.level).toBe("혼잡");
  });

  it("탑승 구간이 없으면 없다", () => {
    expect(overallCongestion(option([walk(600)]))).toBeUndefined();
  });

  it("탑승 구간이 모두 통계이거나 출처를 모르면 추정이 아니다", () => {
    expect(
      overallCongestion(option([segment({ congestionSource: "STATISTICS" }), segment({ congestionSource: undefined })]))?.estimated
    ).toBe(false);
  });

  it("탑승 구간 하나라도 추정이면 추정이다 (도보 구간은 보지 않는다)", () => {
    expect(
      overallCongestion(option([segment({ congestionSource: "STATISTICS" }), segment({ congestionSource: "MOCK" })]))?.estimated
    ).toBe(true);
    expect(overallCongestion(option([segment({ congestionSource: "STATISTICS" }), walk(300)]))?.estimated).toBe(false);
  });
});

describe("pillSegments", () => {
  const express = segment({ isExpress: true, durationSec: 1440 });

  it("넓은 탑승 구간은 호선과 급행 표시와 분을 쓰고 도보는 분을 쓴다", () => {
    const [ride, end] = pillSegments(option([express, walk(480)]));
    expect(ride.label).toBe("9호선 급행 24분");
    expect(end.label).toBe("8분");
    expect(end.isWalk).toBe(true);
  });

  it("9호선 일반은 일반이라고 밝히고 다른 노선은 급행일 때만 표시한다", () => {
    expect(pillSegments(option([segment({ durationSec: 2040 })]))[0].label).toBe("9호선 일반 34분");
    expect(pillSegments(option([segment({ lineId: "02", durationSec: 2040 })]))[0].label).toBe("2호선 34분");
  });

  it("좁은 구간은 분만, 아주 좁으면 글자 없이, 짧은 도보는 숫자만 쓴다", () => {
    const parts = pillSegments(
      option([walk(120), segment({ lineId: "02", durationSec: 3600 }), segment({ durationSec: 1320 }), segment({ lineId: "SB", durationSec: 120 }), walk(60)])
    );
    expect(parts.map((part) => part.label)).toEqual(["2", "2호선 60분", "22분", "", "1"]);
  });

  it("폭은 소요 시간에 비례하고 최소 1이다", () => {
    const parts = pillSegments(option([segment({ durationSec: 2400 }), walk(10)]));
    expect(parts[0].flex).toBeGreaterThan(parts[1].flex);
    expect(parts[1].flex).toBeGreaterThanOrEqual(1);
  });
});

describe("탑승 칸과 별도 요금", () => {
  const cars = [1, 2, 3, 4, 5, 6, 7].map((carNo) => ({
    carNo,
    rate: 50,
    level: "보통" as const,
    isWeakAirConditioned: carNo === 7 || carNo === 4,
  }));

  it("약냉방칸 번호를 작은 순으로 돌려준다", () => {
    expect(weakAcCarNumbers(segment({ cars }))).toEqual([4, 7]);
    expect(weakAcCarNumbers(segment({}))).toEqual([]);
  });

  it("첫 탑승 구간의 추천 칸을 쓴다", () => {
    expect(firstRideCars(option([walk(60), segment({ recommendedCarNo: 3, cars })]))).toEqual({ carNo: 3, weakAc: [4, 7] });
    expect(firstRideCars(option([walk(600)]))).toBeUndefined();
  });

  it("별도 운임 노선 이름을 중복 없이 모은다", () => {
    const names = separateFareLineNames(option([segment({ lineId: "09" }), segment({ lineId: "SB" }), segment({ lineId: "SB" })]));
    expect(names).toEqual(["신분당선"]);
    expect(separateFareLineNames(option([segment({})]))).toEqual([]);
  });
});

describe("alightInfo", () => {
  it("마지막 탑승 구간의 하차역과 뒤따르는 도보를 돌려준다", () => {
    expect(alightInfo(option([segment({ isExpress: true }), walk(480)]))).toEqual({
      station: "신논현",
      walkMinutes: 8,
      walkTo: "강남역",
    });
  });

  it("도보가 없으면 하차역만 돌려준다", () => {
    expect(alightInfo(option([segment({})]))).toEqual({ station: "신논현" });
  });
});

describe("waitingText", () => {
  it("1분 미만은 곧, 그 이상은 올림한 분으로 쓴다", () => {
    expect(waitingText(30)).toBe("곧");
    expect(waitingText(61)).toBe("2분 후");
    expect(waitingText(120)).toBe("2분 후");
  });

  it("모르면 빈 문자열이다", () => {
    expect(waitingText(null)).toBe("");
    expect(waitingText(undefined)).toBe("");
  });
});
