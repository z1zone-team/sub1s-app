import type { PathSegmentDto, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import {
  buildStops,
  currentSegment,
  distanceMeters,
  visibleStopIndexes,
  guideProgress,
  nearestStopIndex,
  upcomingAction,
} from "./progress";

const segment = (
  lineId: string,
  from: string,
  to: string,
  durationSec: number
): PathSegmentDto => ({
  lineId,
  direction: "DOWN",
  isExpress: false,
  fromStationId: from,
  fromStationName: from,
  toStationId: to,
  toStationName: to,
  stationCount: 2,
  durationSec,
  distanceKm: 1,
  recommendedCarNo: 4,
  isWeakAirConditioned: false,
  congestionLevel: "여유",
  congestionRate: 20,
  operationStatus: "NORMAL",
});

// 02호선 a-b-c, 도보 c에서 d, 03호선 d-e-f
const IDS = ["a", "b", "c", "d", "e", "f"];
const option = {
  totalDurationSec: 1000,
  segments: [
    segment("02", "a", "c", 400),
    segment("WALK", "c", "d", 100),
    segment("03", "d", "f", 500),
  ],
  stationIds: IDS,
} as unknown as SubwayRouteOptionDto;

describe("buildStops", () => {
  it("구간 소요 시간을 지나는 역에 나눠 붙인다", () => {
    expect(buildStops(option, IDS).map((stop) => stop.atSec)).toEqual([0, 200, 400, 500, 750, 1000]);
  });

  it("환승과 하차 역을 표시한다", () => {
    const events = buildStops(option, IDS).map((stop) => stop.event);
    expect(events).toEqual([undefined, undefined, "TRANSFER", undefined, undefined, "ALIGHT"]);
  });

  it("역마다 출발하는 구간 번호를 붙이고 도착역에는 붙이지 않는다", () => {
    const segmentIndexes = buildStops(option, IDS).map((stop) => stop.segmentIndex);
    expect(segmentIndexes).toEqual([0, 0, 1, 2, 2, undefined]);
  });

  it("구간이 역 목록과 맞지 않으면 전체 시간을 역 수로 나눈다", () => {
    const stops = buildStops(option, ["a", "x", "y", "z"]);
    expect(stops.map((stop) => stop.atSec)).toEqual([0, 1000 / 3, 2000 / 3, 1000]);
    expect(stops[3].event).toBe("ALIGHT");
  });

  it("역이 없으면 빈 목록이다", () => {
    expect(buildStops(option, [])).toEqual([]);
  });
});

describe("buildStops 환승 걷기 구간이 없는 경로", () => {
  // 서버는 환승 걷기를 구간으로 주지 않을 수 있고 출발역이 첫 구간 앞에 있을 수 있다
  const gapOption = {
    totalDurationSec: 1050,
    segments: [segment("07", "b", "c", 400), segment("SB", "d", "f", 500)],
  } as unknown as SubwayRouteOptionDto;

  it("구간 밖의 역은 앞뒤 역 사이를 나눠 시간을 채운다", () => {
    const stops = buildStops(gapOption, ["a", "b", "c", "d", "e", "f"]);
    expect(stops.map((stop) => stop.atSec)).toEqual([0, 0, 400, 400, 650, 900]);
    expect(stops[2].event).toBe("TRANSFER");
    expect(stops[5].event).toBe("ALIGHT");
  });
});

describe("visibleStopIndexes", () => {
  it("환승역처럼 이름이 연달아 같은 역은 하나만 남긴다", () => {
    expect(visibleStopIndexes(["태릉입구", "태릉입구", "공릉", "공릉", "하계"])).toEqual([0, 2, 4]);
  });

  it("이름을 아직 모르면 모두 남긴다", () => {
    expect(visibleStopIndexes(["", "", "하계"])).toEqual([0, 1, 2]);
  });
});

describe("guideProgress", () => {
  const stops = buildStops(option, IDS);
  const start = 1_000_000;

  it("출발 직후에는 첫 역에 있다", () => {
    const progress = guideProgress(stops, start, start);
    expect(progress).toMatchObject({ currentIndex: 0, nextIndex: 1, stopsLeft: 5, remainingSec: 1000 });
  });

  it("경과 시간만큼 지난 역을 현재 역으로 본다", () => {
    const progress = guideProgress(stops, start, start + 450_000);
    expect(progress).toMatchObject({ currentIndex: 2, nextIndex: 3, stopsLeft: 3, remainingSec: 550 });
  });

  it("시간이 다 지나도 도착역에 도착했다고 하지 않고 마지막 직전 역에 둔다", () => {
    const progress = guideProgress(stops, start, start + 5_000_000);
    expect(progress).toMatchObject({ currentIndex: 4, nextIndex: 5, atFinalStop: false, remainingSec: 0 });
  });

  it("사용자가 알려 준 역을 기준으로 이어서 센다", () => {
    const anchor = { index: 2, atMs: start + 100_000 };
    const progress = guideProgress(stops, start, start + 150_000, anchor);
    expect(progress.currentIndex).toBe(2);
    expect(progress.remainingSec).toBe(550);
  });

  it("알려 준 역보다 뒤로 가지 않는다", () => {
    const anchor = { index: 4, atMs: start + 10_000 };
    expect(guideProgress(stops, start, start + 10_000, anchor).currentIndex).toBe(4);
  });

  it("도착역을 알려 주면 도착으로 본다", () => {
    const progress = guideProgress(stops, start, start + 50_000, { index: 5, atMs: start + 50_000 });
    expect(progress).toMatchObject({ currentIndex: 5, atFinalStop: true, stopsLeft: 0 });
  });

  it("역이 하나뿐이면 바로 도착이다", () => {
    expect(guideProgress(buildStops(option, ["a"]), start, start).atFinalStop).toBe(true);
  });
});

describe("upcomingAction", () => {
  const stops = buildStops(option, IDS);

  it("가장 가까운 환승이나 하차를 알려 준다", () => {
    expect(upcomingAction(stops, 0)).toEqual({ kind: "TRANSFER", index: 2, stopsAway: 2 });
    expect(upcomingAction(stops, 1)).toEqual({ kind: "TRANSFER", index: 2, stopsAway: 1 });
    expect(upcomingAction(stops, 3)).toEqual({ kind: "ALIGHT", index: 5, stopsAway: 2 });
  });

  it("도착역에서는 없다", () => {
    expect(upcomingAction(stops, 5)).toBeNull();
  });
});

describe("currentSegment", () => {
  const stops = buildStops(option, IDS);

  it("타고 있는 열차 구간을 돌려준다", () => {
    expect(currentSegment(option, stops, 1)?.lineId).toBe("02");
    expect(currentSegment(option, stops, 4)?.lineId).toBe("03");
  });

  it("도보 중에는 다음에 탈 열차 구간을 돌려준다", () => {
    expect(currentSegment(option, stops, 2)?.lineId).toBe("03");
  });
});

describe("위치로 역 찾기", () => {
  const gangnam = { lat: 37.4979, lng: 127.0276 };
  const yeoksam = { lat: 37.5007, lng: 127.0364 };

  it("거리를 미터로 계산한다", () => {
    const meters = distanceMeters(gangnam, yeoksam);
    expect(meters).toBeGreaterThan(750);
    expect(meters).toBeLessThan(900);
  });

  it("기준 거리 안에서 가장 가까운 역의 순번을 돌려준다", () => {
    const here = { lat: 37.4981, lng: 127.0279 };
    expect(nearestStopIndex(here, [yeoksam, gangnam], 300)).toBe(1);
  });

  it("기준 거리 안에 역이 없으면 -1이다", () => {
    expect(nearestStopIndex({ lat: 37.6, lng: 127.1 }, [gangnam, yeoksam], 300)).toBe(-1);
  });

  it("좌표가 없는 역은 건너뛴다", () => {
    expect(nearestStopIndex(gangnam, [undefined, gangnam], 300)).toBe(1);
  });
});
