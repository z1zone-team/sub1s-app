import type { PathSegmentDto, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { delayParts } from "./offRoute";
import { buildRerouteRows } from "./rerouteView";

const segment = (over: Partial<PathSegmentDto>): PathSegmentDto => ({
  lineId: "09",
  direction: "UP",
  isExpress: true,
  fromStationId: "09_923",
  fromStationName: "고속터미널",
  toStationId: "09_925",
  toStationName: "신논현",
  stationCount: 1,
  durationSec: 180,
  distanceKm: 1,
  recommendedCarNo: 1,
  isWeakAirConditioned: false,
  congestionLevel: "보통",
  congestionRate: 43,
  operationStatus: "NORMAL",
  ...over,
});

const walk = (durationSec: number, toStationName: string): PathSegmentDto =>
  segment({ lineId: "WALK", direction: "NONE", isExpress: false, durationSec, toStationName, recommendedCarNo: 0 });

const option = (segments: PathSegmentDto[]): SubwayRouteOptionDto => ({
  mode: "OPTIMAL",
  totalDurationSec: segments.reduce((sum, s) => sum + s.durationSec, 0),
  totalDistanceKm: 1,
  totalFare: 1750,
  transferCount: 0,
  estimatedArrivalTimestamp: "2026-10-12T06:09:00.000Z",
  segments,
  highlights: [],
  operationStatus: "NORMAL",
});

describe("buildRerouteRows", () => {
  it("이탈한 역 하차, 승차, 도착 순서로 만든다", () => {
    const rows = buildRerouteRows(option([segment({})]), "고속터미널");
    expect(rows.map((row) => row.kind)).toEqual(["leave", "board", "arrive"]);
    expect(rows[0]).toMatchObject({ kind: "leave", stationName: "고속터미널", walkMinutes: undefined });
    expect(rows[2]).toMatchObject({ kind: "arrive", stationName: "신논현", stationId: "09_925" });
  });

  it("맞은편 승강장으로 걷는 구간이 앞에 있으면 그 시간을 첫 행에 붙인다", () => {
    const rows = buildRerouteRows(option([walk(60, "고속터미널"), segment({})]), "고속터미널");
    expect(rows[0]).toMatchObject({ kind: "leave", walkMinutes: 1 });
    expect(rows.map((row) => row.kind)).toEqual(["leave", "board", "arrive"]);
  });

  it("도착역 뒤의 도보는 도착 행에 붙는다", () => {
    const rows = buildRerouteRows(option([segment({}), walk(480, "강남역")]), "고속터미널");
    expect(rows[rows.length - 1]).toMatchObject({ kind: "arrive", walkMinutes: 8, walkTo: "강남역" });
  });

  it("환승이 있으면 탑승 구간마다 승차 행이 있고 첫 탑승만 isFirstRide다", () => {
    const rows = buildRerouteRows(
      option([segment({}), segment({ lineId: "02", fromStationId: "02_1", toStationId: "02_2", toStationName: "강남" })]),
      "고속터미널"
    );
    const boards = rows.filter((row) => row.kind === "board");
    expect(boards.map((row) => row.kind === "board" && row.isFirstRide)).toEqual([true, false]);
    expect(rows[rows.length - 1]).toMatchObject({ kind: "arrive", stationName: "강남" });
  });

  it("탑승 구간이 없으면 하차 행 하나만 있다", () => {
    expect(buildRerouteRows(option([walk(300, "어딘가")]), "고속터미널").map((row) => row.kind)).toEqual(["leave"]);
  });
});

describe("delayParts", () => {
  it("더 늦으면 late이고 문구는 +분이다", () => {
    expect(delayParts(33 * 60, 22 * 60)).toEqual({ text: "+11분", late: true });
  });

  it("더 빠르거나 같으면 late이 아니다", () => {
    expect(delayParts(10 * 60, 11 * 60)).toEqual({ text: "1분 빨라요", late: false });
    expect(delayParts(600, 600)).toEqual({ text: "예정과 비슷해요", late: false });
  });
});
