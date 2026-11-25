import type { PathSegmentDto, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import {
  arrivalText,
  rowFromEndpoint,
  shouldOfferOriginFallback,
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

describe("shouldOfferOriginFallback", () => {
  const base = { fixTimedOut: false, locationDenied: false, originChosenByUser: false, origin: undefined };
  const origin = { name: "현재 위치", lat: 37.5, lng: 127 };

  it("위치를 기다리는 동안에는 보이지 않는다", () => {
    expect(shouldOfferOriginFallback(base)).toBe(false);
  });

  it("제한 시간 안에 위치를 못 잡으면 보인다", () => {
    expect(shouldOfferOriginFallback({ ...base, fixTimedOut: true })).toBe(true);
  });

  it("위치 권한이 없으면 바로 보인다", () => {
    expect(shouldOfferOriginFallback({ ...base, locationDenied: true })).toBe(true);
  });

  it("출발지가 이미 정해졌으면 보이지 않는다", () => {
    expect(shouldOfferOriginFallback({ ...base, fixTimedOut: true, origin })).toBe(false);
  });

  it("사용자가 출발지를 골랐으면 보이지 않는다", () => {
    expect(shouldOfferOriginFallback({ ...base, locationDenied: true, originChosenByUser: true })).toBe(false);
  });
});
