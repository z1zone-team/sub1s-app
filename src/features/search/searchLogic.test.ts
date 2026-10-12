import type { PathSegmentDto, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import type { RecentDestination } from "@/features/routing/recentDestinations";
import { groupRouteOptions } from "@/features/routing/routeView";
import {
  arrivalText,
  pickRecommendedGroups,
  recommendedPair,
  rowFromEndpoint,
  summarizeRoute,
  swapEndpoints,
  transferAndWalkText,
} from "./searchLogic";

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

const option = (over: Partial<SubwayRouteOptionDto>): SubwayRouteOptionDto => ({
  mode: "OPTIMAL",
  totalDurationSec: 1920,
  totalDistanceKm: 17,
  totalFare: 2150,
  transferCount: 0,
  estimatedArrivalTimestamp: "2026-10-12T05:51:00.000Z",
  segments: [
    segment({ isExpress: true }),
    segment({ lineId: "WALK", fromStationName: "신논현", toStationName: "강남역", durationSec: 480 }),
  ],
  highlights: [],
  operationStatus: "NORMAL",
  ...over,
});

const recent = (name: string, stationId?: string): RecentDestination => ({
  endpoint: { name, stationId },
  searchedAt: "2026-10-06T00:00:00Z",
  routeIds: [name],
});

describe("swapEndpoints", () => {
  it("출발과 도착을 서로 바꾼다", () => {
    const a = { name: "가양", stationId: "09_907" };
    const b = { name: "강남", stationId: "02_222" };
    expect(swapEndpoints(a, b)).toEqual({ origin: b, destination: a });
  });

  it("한쪽이 비어 있으면 비어 있는 채로 따라간다", () => {
    const a = { name: "현재 위치", lat: 37.5, lng: 126.8 };
    expect(swapEndpoints(a, undefined)).toEqual({ origin: undefined, destination: a });
  });
});

describe("recommendedPair", () => {
  const here = { name: "현재 위치", lat: 37.56, lng: 126.85 };

  it("현재 위치에서 가장 최근 도착지로 짝을 만든다", () => {
    const pair = recommendedPair(here, [recent("신논현", "09_925"), recent("충무로", "03_331")]);
    expect(pair?.destination.name).toBe("신논현");
    expect(pair?.origin).toBe(here);
  });

  it("출발지나 최근 도착지가 없으면 추천하지 않는다", () => {
    expect(recommendedPair(undefined, [recent("신논현", "09_925")])).toBeUndefined();
    expect(recommendedPair(here, [])).toBeUndefined();
  });

  it("출발과 도착이 같은 역이면 추천하지 않는다", () => {
    const origin = { name: "신논현", stationId: "09_925" };
    expect(recommendedPair(origin, [recent("신논현", "09_925")])).toBeUndefined();
  });
});

describe("pickRecommendedGroups", () => {
  it("최적을 맨 위에 두고 다른 경로의 여유를 하나 더 보여 준다", () => {
    const groups = groupRouteOptions([
      option({ mode: "OPTIMAL" }),
      option({ mode: "COMFORTABLE", totalDurationSec: 3120, transferCount: 1, segments: [segment({ lineId: "02" })] }),
      option({ mode: "CHEAPEST", totalFare: 1750, totalDurationSec: 3300, segments: [segment({ lineId: "01" })] }),
    ]);
    const picked = pickRecommendedGroups(groups);
    expect(picked.map((group) => group.modes[0])).toEqual(["OPTIMAL", "COMFORTABLE"]);
  });

  it("최적과 여유가 같은 경로면 한 장만 보여 준다", () => {
    const groups = groupRouteOptions([option({ mode: "OPTIMAL" }), option({ mode: "COMFORTABLE" })]);
    expect(pickRecommendedGroups(groups)).toHaveLength(1);
  });

  it("결과가 비어 있으면 빈 목록이다", () => {
    expect(pickRecommendedGroups([])).toEqual([]);
  });
});

describe("카드 문구", () => {
  it("환승과 도보를 한 줄로 쓴다", () => {
    expect(transferAndWalkText(option({}))).toBe("환승 0회 · 도보 8분");
  });

  it("도보가 없으면 환승만 쓴다", () => {
    const noWalk = option({ totalDurationSec: 1440, segments: [segment({})] });
    expect(transferAndWalkText(noWalk)).toBe("환승 0회");
  });

  it("도착 시각을 한국 시간 24시간제로 쓴다", () => {
    expect(arrivalText(option({}))).toBe("14:51 도착");
  });

  it("탑승 구간과 마지막 도보 목적지를 요약한다", () => {
    const summary = summarizeRoute(option({}));
    expect(summary.rides).toEqual([{ lineId: "09", isExpress: true, from: "가양", to: "신논현" }]);
    expect(summary.walkTo).toBe("강남역");
  });

  it("도보로 끝나지 않으면 도보 목적지가 없다", () => {
    expect(summarizeRoute(option({ segments: [segment({})] })).walkTo).toBeUndefined();
  });
});

describe("rowFromEndpoint", () => {
  it("역은 호선 배지와 함께 역 행이 된다", () => {
    const row = rowFromEndpoint({ name: "신논현", stationId: "09_925" }, ["09", "SB"]);
    expect(row).toMatchObject({ kind: "STATION", title: "신논현", lineIds: ["09", "SB"] });
  });

  it("좌표만 있는 곳은 장소 행이 되고 호선이 없다", () => {
    const row = rowFromEndpoint({ name: "서울시청", lat: 37.56, lng: 126.97 }, ["01"]);
    expect(row.kind).toBe("PLACE");
    expect(row.lineIds).toEqual([]);
    expect(row.endpoint.lat).toBe(37.56);
  });
});
