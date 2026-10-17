import type { PathSegmentDto, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { formatClockKst } from "@/common/utils/format";
import { buildTimeline, clockRangeShort, mapStationIds, routeMapData, timeLabel } from "./routeTimeline";

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

const walk = (durationSec: number, from: string, to: string): PathSegmentDto =>
  segment({ lineId: "WALK", direction: "NONE", fromStationId: from, toStationId: to, durationSec, recommendedCarNo: 0 });

const option = (segments: PathSegmentDto[], stationIds?: string[]): SubwayRouteOptionDto => ({
  mode: "OPTIMAL",
  totalDurationSec: segments.reduce((sum, s) => sum + s.durationSec, 0),
  totalDistanceKm: 17,
  totalFare: 1750,
  transferCount: 0,
  estimatedArrivalTimestamp: "2026-10-12T05:51:00.000Z",
  segments,
  stationIds,
  highlights: [],
  operationStatus: "NORMAL",
});

describe("buildTimeline", () => {
  it("승차, 하차, 도보, 도착 행을 만들고 시각을 거꾸로 계산한다", () => {
    const rows = buildTimeline(option([segment({ durationSec: 1440 }), walk(480, "09_925", "02_222")]));
    expect(rows.map((row) => row.kind)).toEqual(["board", "alight", "walk", "arrive"]);
    // 도착 14:51, 전체 1920초이므로 출발 14:19, 하차 14:43
    expect(timeLabel(rows[0].kind === "board" ? rows[0].timeMs : undefined)).toBe("14:19");
    expect(timeLabel(rows[1].kind === "alight" ? rows[1].timeMs : undefined)).toBe("14:43");
    expect(timeLabel(rows[3].kind === "arrive" ? rows[3].timeMs : undefined)).toBe("14:51");
  });

  it("도보로 시작하면 출발 행을 앞에 둔다", () => {
    const rows = buildTimeline(option([walk(600, "x", "09_907"), segment({})]));
    expect(rows.map((row) => row.kind)).toEqual(["depart", "walk", "board", "alight", "arrive"]);
  });

  it("환승하면 하차 행이 환승으로 표시되고 승차 행이 이어진다", () => {
    const rows = buildTimeline(
      option([segment({ durationSec: 600 }), segment({ lineId: "02", fromStationId: "02_1", toStationId: "02_2", durationSec: 900 })])
    );
    const alight = rows.filter((row) => row.kind === "alight");
    expect(alight.map((row) => row.kind === "alight" && row.transfer)).toEqual([true, false]);
    expect(rows.filter((row) => row.kind === "board")).toHaveLength(2);
  });

  it("첫 탑승만 isFirstRide다", () => {
    const rows = buildTimeline(
      option([walk(300, "x", "09_907"), segment({ durationSec: 600 }), segment({ lineId: "02", durationSec: 600 })])
    );
    const flags = rows.filter((row) => row.kind === "board").map((row) => row.kind === "board" && row.isFirstRide);
    expect(flags).toEqual([true, false]);
  });

  it("도착 시각을 모르면 시각을 비운다", () => {
    const rows = buildTimeline({ ...option([segment({})]), estimatedArrivalTimestamp: "" });
    expect(rows.every((row) => !("timeMs" in row) || row.timeMs === undefined)).toBe(true);
    expect(timeLabel(undefined)).toBe("");
  });
});

describe("clockRangeShort", () => {
  it("오전과 오후가 같으면 뒤쪽은 시각만 쓴다", () => {
    expect(clockRangeShort(option([segment({ durationSec: 2040 })]), formatClockKst)).toBe("오후 2:17 - 2:51");
  });

  it("걸치면 둘 다 쓴다", () => {
    const o = { ...option([segment({ durationSec: 1800 })]), estimatedArrivalTimestamp: "2026-10-12T03:10:00.000Z" };
    expect(clockRangeShort(o, formatClockKst)).toBe("오전 11:40 - 오후 12:10");
  });
});

describe("mapStationIds", () => {
  const ids = Array.from({ length: 40 }, (_, i) => `s${i}`);

  it("20개 이하면 그대로, 중복은 한 번만", () => {
    expect(mapStationIds(option([segment({})], ["a", "b", "a"]))).toEqual(["a", "b"]);
  });

  it("많으면 구간 끝역을 먼저 넣고 20개로 줄인다", () => {
    const result = mapStationIds(option([segment({ fromStationId: "s0", toStationId: "s39" })], ids));
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result).toContain("s0");
    expect(result).toContain("s39");
  });
});

describe("routeMapData", () => {
  const coords = new Map([
    ["a", { lat: 37.5, lng: 126.8 }],
    ["b", { lat: 37.52, lng: 126.9 }],
    ["c", { lat: 37.5, lng: 127.0 }],
    ["d", { lat: 37.49, lng: 127.02 }],
  ]);

  it("탑승 구간은 호선 색 선, 도보는 점선으로 잇는다", () => {
    const data = routeMapData(
      option(
        [segment({ fromStationId: "a", toStationId: "c" }), walk(480, "c", "d")],
        ["a", "b", "c", "d"]
      ),
      coords
    );
    expect(data.lines).toHaveLength(2);
    expect(data.lines[0].points).toEqual([[37.5, 126.8], [37.52, 126.9], [37.5, 127.0]]);
    expect(data.lines[0].dashed).toBe(false);
    expect(data.lines[1].dashed).toBe(true);
    expect(data.fit).toBe(true);
  });

  it("승하차역과 처음, 끝에 점을 찍는다", () => {
    const data = routeMapData(option([segment({ fromStationId: "a", toStationId: "c" })], ["a", "b", "c"]), coords);
    expect(data.markers).toHaveLength(4);
  });

  it("중간역 좌표를 모르면 시작과 끝으로 잇는다", () => {
    const data = routeMapData(option([segment({ fromStationId: "a", toStationId: "c" })], ["a", "x", "c"]), coords);
    expect(data.lines[0].points).toEqual([[37.5, 126.8], [37.5, 127.0]]);
  });

  it("도보만 있는 경로는 출발지와 도착지 좌표로 점선을 잇는다", () => {
    const data = routeMapData(
      option([walk(1200, "ORIGIN_COORDINATE", "DEST_COORDINATE")]),
      new Map(),
      { origin: { lat: 37.4, lng: 127.1 }, destination: { lat: 37.41, lng: 127.12 } }
    );
    expect(data.lines).toHaveLength(1);
    expect(data.lines[0].dashed).toBe(true);
    expect(data.lines[0].points).toEqual([[37.4, 127.1], [37.41, 127.12]]);
    expect(data.markers).toHaveLength(2);
    expect(data.fit).toBe(true);
  });

  it("역까지 걷는 첫 구간도 출발지 좌표에서 시작하는 점선이 된다", () => {
    const data = routeMapData(
      option([walk(300, "ORIGIN_COORDINATE", "a"), segment({ fromStationId: "a", toStationId: "c" })], ["a", "b", "c"]),
      coords,
      { origin: { lat: 37.49, lng: 126.79 } }
    );
    expect(data.lines[0].dashed).toBe(true);
    expect(data.lines[0].points).toEqual([[37.49, 126.79], [37.5, 126.8]]);
  });

  it("출발지 좌표를 모르면 그 걷기 구간은 그리지 않는다", () => {
    const data = routeMapData(option([walk(300, "ORIGIN_COORDINATE", "a")]), coords);
    expect(data.lines).toHaveLength(0);
  });

  it("좌표가 하나도 없으면 맞추지 않는다", () => {
    expect(routeMapData(option([segment({})], ["a"]), new Map()).fit).toBe(false);
  });
});
