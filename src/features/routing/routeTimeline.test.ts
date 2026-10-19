import type { PathSegmentDto, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { formatClockKst } from "@/common/utils/format";
import {
  buildTimeline,
  clockRangeShort,
  mapStationIds,
  routeMapData,
  routeSegmentPoints,
  sameTarget,
  targetFocusPoints,
  timeLabel,
} from "./routeTimeline";

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

  it("서버의 승차 시각(boardingAt)이 있으면 환승 걷기만큼 다음 승차가 늦고 환승 걷기 시간을 알려 준다", () => {
    // 도착 14:46:30. 14:19 승차 -> 10분 주행 -> 14:29 하차 -> 150초 걷기 -> 14:31:30 승차 -> 15분 주행 -> 14:46:30 하차
    const rows = buildTimeline({
      ...option([
        segment({ durationSec: 600, boardingAt: "2026-10-12T05:19:00.000Z" }),
        segment({ lineId: "02", fromStationId: "02_1", toStationId: "02_2", durationSec: 900, boardingAt: "2026-10-12T05:31:30.000Z" }),
      ]),
      totalDurationSec: 1650,
      estimatedArrivalTimestamp: "2026-10-12T05:46:30.000Z",
    });
    const boards = rows.filter((row) => row.kind === "board");
    const alights = rows.filter((row) => row.kind === "alight");
    expect(boards.map((row) => timeLabel(row.kind === "board" ? row.timeMs : undefined))).toEqual(["14:19", "14:31"]);
    expect(alights.map((row) => (row.kind === "alight" ? row.transferWalkSec : -1))).toEqual([150, undefined]);
    expect(timeLabel(alights[0].kind === "alight" ? alights[0].timeMs : undefined)).toBe("14:29");
    expect(timeLabel(alights[1].kind === "alight" ? alights[1].timeMs : undefined)).toBe("14:46");
  });

  it("승차 시각이 없으면 소요 시간만 더하고 환승 걷기 시간은 모른다", () => {
    const rows = buildTimeline(
      option([segment({ durationSec: 600 }), segment({ lineId: "02", fromStationId: "02_1", toStationId: "02_2", durationSec: 900 })])
    );
    const alight = rows.find((row) => row.kind === "alight");
    expect(alight && alight.kind === "alight" ? alight.transferWalkSec : "x").toBeUndefined();
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
    // 열차 구간만 흰 테두리와 진행 방향 화살표가 있고, 도보 점선에는 없다
    expect(data.lines[0]).toMatchObject({ border: true, arrows: true });
    expect(data.lines[1].border).toBeUndefined();
    expect(data.lines[1].arrows).toBeUndefined();
    expect(data.fit).toBe(true);
  });

  it("호선을 갈아타는 곳은 내리는 역과 타는 역을 점선으로 잇는다", () => {
    const data = routeMapData(
      option(
        [segment({ fromStationId: "a", toStationId: "c" }), segment({ lineId: "01", fromStationId: "d", toStationId: "b" })],
        ["a", "b", "c", "d", "b"]
      ),
      coords
    );
    const link = data.lines.find((l) => l.dashed);
    expect(link?.points).toEqual([[37.5, 127.0], [37.49, 127.02]]);
    // 같은 자리에서 갈아타면 잇지 않는다
    const same = routeMapData(
      option([segment({ fromStationId: "a", toStationId: "c" }), segment({ lineId: "01", fromStationId: "c", toStationId: "d" })], ["a", "b", "c", "d"]),
      coords
    );
    expect(same.lines.some((l) => l.dashed)).toBe(false);
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

  describe("실제 보행 경로 선(path)", () => {
    // 구글 문서 예시 선: (38.5, -120.2), (40.7, -120.95), (43.252, -126.453)
    const PATH = "_p~iF~ps|U_ulLnnqC_mqNvxq`@";
    const routedWalk = (from: string, to: string): PathSegmentDto => ({ ...walk(300, from, to), path: PATH });

    it("도보 구간에 path가 있으면 그 점들로 점선을 그리고 양 끝에 출발지와 역 좌표를 이어 붙인다", () => {
      const data = routeMapData(
        option([routedWalk("ORIGIN_COORDINATE", "a"), segment({ fromStationId: "a", toStationId: "c" })], ["a", "b", "c"]),
        coords,
        { origin: { lat: 37.49, lng: 126.79 } }
      );
      expect(data.lines[0].dashed).toBe(true);
      expect(data.lines[0].points).toEqual([
        [37.49, 126.79],
        [38.5, -120.2],
        [40.7, -120.95],
        [43.252, -126.453],
        [37.5, 126.8],
      ]);
    });

    it("출발지 좌표를 몰라도 path가 있으면 그린다(알려진 쪽 끝만 이어 붙인다)", () => {
      const data = routeMapData(option([routedWalk("ORIGIN_COORDINATE", "a")]), coords);
      expect(data.lines).toHaveLength(1);
      expect(data.lines[0].points[0]).toEqual([38.5, -120.2]);
      expect(data.lines[0].points[data.lines[0].points.length - 1]).toEqual([37.5, 126.8]);
    });

    it("path가 깨져 있으면 지금처럼 두 점을 직선으로 잇는다", () => {
      const broken: PathSegmentDto = { ...walk(300, "ORIGIN_COORDINATE", "a"), path: "_p~iF" };
      const data = routeMapData(option([broken]), coords, { origin: { lat: 37.49, lng: 126.79 } });
      expect(data.lines[0].points).toEqual([[37.49, 126.79], [37.5, 126.8]]);
    });

    it("탑승 구간은 path가 있으면 실제 선로 모양으로 그린다", () => {
      const ride: PathSegmentDto = { ...segment({ fromStationId: "a", toStationId: "c" }), path: PATH };
      const data = routeMapData(option([ride], ["a", "b", "c"]), coords);
      expect(data.lines[0].points).toEqual([[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]]);
    });

    it("탑승 구간의 path가 없거나 깨져 있으면 지나는 역 순서로 그린다", () => {
      const noPath: PathSegmentDto = segment({ fromStationId: "a", toStationId: "c" });
      const broken: PathSegmentDto = { ...noPath, path: "_p~iF" };
      const stations = [[37.5, 126.8], [37.52, 126.9], [37.5, 127.0]];
      expect(routeMapData(option([noPath], ["a", "b", "c"]), coords).lines[0].points).toEqual(stations);
      expect(routeMapData(option([broken], ["a", "b", "c"]), coords).lines[0].points).toEqual(stations);
    });
  });
});

describe("칸을 눌렀을 때 지도에 보여 줄 좌표", () => {
  const coords = new Map([
    ["09_907", { lat: 37.5, lng: 126.8 }],
    ["09_908", { lat: 37.51, lng: 126.85 }],
    ["09_925", { lat: 37.5, lng: 127.0 }],
    ["02_222", { lat: 37.49, lng: 127.02 }],
  ]);
  const ride = segment({});
  const walking = walk(480, "09_925", "02_222");
  const route = option([ride, walking], ["09_907", "09_908", "09_925", "02_222"]);

  it("구간마다 지도에서 지나는 좌표를 돌려준다: 탑승은 지나는 역을, 도보는 처음과 끝을", () => {
    expect(routeSegmentPoints(route, coords)).toEqual([
      [
        [37.5, 126.8],
        [37.51, 126.85],
        [37.5, 127.0],
      ],
      [
        [37.5, 127.0],
        [37.49, 127.02],
      ],
    ]);
  });

  it("지도에 그리는 선과 같은 좌표다", () => {
    const lines = routeMapData(route, coords).lines.map((line) => line.points);
    expect(lines).toEqual(routeSegmentPoints(route, coords));
  });

  it("구간을 누르면 그 구간 전체 좌표를 돌려준다", () => {
    expect(targetFocusPoints(route, coords, {}, { kind: "segment", segment: walking })).toEqual([
      [37.5, 127.0],
      [37.49, 127.02],
    ]);
    expect(targetFocusPoints(route, coords, {}, { kind: "segment", segment: ride })).toHaveLength(3);
  });

  it("같은 구간이면 객체가 달라도 찾는다", () => {
    expect(targetFocusPoints(route, coords, {}, { kind: "segment", segment: { ...walking } })).toHaveLength(2);
  });

  it("역, 출발, 도착은 한 점이다", () => {
    expect(targetFocusPoints(route, coords, {}, { kind: "station", stationId: "09_925" })).toEqual([[37.5, 127.0]]);
    expect(targetFocusPoints(route, coords, {}, { kind: "depart" })).toEqual([[37.5, 126.8]]);
    expect(targetFocusPoints(route, coords, {}, { kind: "arrive" })).toEqual([[37.49, 127.02]]);
  });

  it("좌표를 모르면 아무것도 보여 주지 않는다", () => {
    expect(targetFocusPoints(route, coords, {}, { kind: "station", stationId: "99_999" })).toBeUndefined();
    expect(targetFocusPoints(route, new Map(), {}, { kind: "segment", segment: ride })).toBeUndefined();
  });

  it("좌표로 정한 출발지와 도착지는 endpoints로 푼다", () => {
    const fromPlace = option([walk(300, "ORIGIN_COORDINATE", "09_907"), ride]);
    expect(targetFocusPoints(fromPlace, coords, { origin: { lat: 37.4, lng: 126.7 } }, { kind: "depart" })).toEqual([[37.4, 126.7]]);
  });

  it("같은 칸을 다시 눌렀는지 알아본다", () => {
    expect(sameTarget(null, { kind: "depart" })).toBe(false);
    expect(sameTarget({ kind: "depart" }, { kind: "depart" })).toBe(true);
    expect(sameTarget({ kind: "depart" }, { kind: "arrive" })).toBe(false);
    expect(sameTarget({ kind: "station", stationId: "a" }, { kind: "station", stationId: "a" })).toBe(true);
    expect(sameTarget({ kind: "station", stationId: "a" }, { kind: "station", stationId: "b" })).toBe(false);
    expect(sameTarget({ kind: "segment", segment: ride }, { kind: "segment", segment: { ...ride } })).toBe(true);
    expect(sameTarget({ kind: "segment", segment: ride }, { kind: "segment", segment: walking })).toBe(false);
  });
});
