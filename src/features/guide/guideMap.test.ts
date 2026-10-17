import type { PathSegmentDto, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { guideMapData } from "./guideMap";

const segment: PathSegmentDto = {
  lineId: "09",
  direction: "UP",
  isExpress: false,
  fromStationId: "a",
  fromStationName: "가양",
  toStationId: "c",
  toStationName: "신논현",
  stationCount: 2,
  durationSec: 600,
  distanceKm: 5,
  recommendedCarNo: 3,
  isWeakAirConditioned: false,
  congestionLevel: "보통",
  congestionRate: 50,
  operationStatus: "NORMAL",
};

const option: SubwayRouteOptionDto = {
  mode: "OPTIMAL",
  totalDurationSec: 600,
  totalDistanceKm: 5,
  totalFare: 1750,
  transferCount: 0,
  estimatedArrivalTimestamp: "2026-10-12T05:51:00.000Z",
  segments: [segment],
  stationIds: ["a", "b", "c"],
  highlights: [],
  operationStatus: "NORMAL",
};

const stations = new Map([
  ["a", { lat: 37.5, lng: 126.8 }],
  ["b", { lat: 37.52, lng: 126.9 }],
  ["c", { lat: 37.5, lng: 127.0 }],
]);

describe("guideMapData", () => {
  it("위치를 모르면 경로 전체가 보이게 맞춘다", () => {
    const data = guideMapData(option, stations);
    expect(data.fit).toBe(true);
    expect(data.markers.some((marker) => marker.kind === "me")).toBe(false);
  });

  it("위치를 알면 내 위치 마커를 더하고 그 주변을 보여 준다", () => {
    const data = guideMapData(option, stations, { lat: 37.51, lng: 126.85 });
    expect(data.markers.filter((marker) => marker.kind === "me")).toHaveLength(1);
    expect(data.fit).toBe(false);
    expect(data.center).toEqual([37.51, 126.85]);
    expect(data.lines.length).toBeGreaterThan(0);
  });

  it("역 좌표를 모르면 선 없이 내 위치만 보여 준다", () => {
    const data = guideMapData(option, new Map(), { lat: 37.51, lng: 126.85 });
    expect(data.lines).toEqual([]);
    expect(data.markers).toHaveLength(1);
  });
});

describe("guideMapData 걷는 구간", () => {
  const walkFirst: SubwayRouteOptionDto = {
    ...option,
    segments: [
      { ...segment, lineId: "WALK", direction: "NONE", fromStationId: "ORIGIN_COORDINATE", toStationId: "a", recommendedCarNo: 0 },
      segment,
      { ...segment, lineId: "WALK", direction: "NONE", fromStationId: "c", toStationId: "DEST_COORDINATE", recommendedCarNo: 0 },
    ],
  };

  it("출발지와 도착지 좌표를 주면 역까지 걷는 구간을 점선으로 이어 그린다", () => {
    const data = guideMapData(walkFirst, stations, undefined, {
      origin: { lat: 37.49, lng: 126.79 },
      destination: { lat: 37.49, lng: 127.01 },
    });

    const dashed = data.lines.filter((line) => line.dashed);
    expect(dashed).toHaveLength(2);
    expect(dashed[0].points).toEqual([[37.49, 126.79], [37.5, 126.8]]);
    expect(dashed[1].points).toEqual([[37.5, 127.0], [37.49, 127.01]]);
  });

  it("좌표를 모르면 걷는 구간은 그리지 않는다", () => {
    const data = guideMapData(walkFirst, stations);

    expect(data.lines.filter((line) => line.dashed)).toHaveLength(0);
  });
});

