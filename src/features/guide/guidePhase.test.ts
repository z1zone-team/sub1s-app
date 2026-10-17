import type { PathSegmentDto, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import {
  boardingStopIndexes,
  guidePhase,
  needsWalkToStation,
  nextBoardingIndex,
  ridesBoardedBy,
  walkPhaseRemainingSec,
} from "./guidePhase";
import { buildStops } from "./progress";

const segment = (lineId: string, from: string, to: string, durationSec: number): PathSegmentDto =>
  ({
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
  }) as PathSegmentDto;

// 02호선 a-b-c, 도보 c에서 d, 03호선 d-e-f
const IDS = ["a", "b", "c", "d", "e", "f"];
const option = {
  totalDurationSec: 1000,
  segments: [segment("02", "a", "c", 400), segment("WALK", "c", "d", 100), segment("03", "d", "f", 500)],
  stationIds: IDS,
} as unknown as SubwayRouteOptionDto;
const stops = buildStops(option, IDS);

describe("boardingStopIndexes", () => {
  it("탑승 구간이 출발하는 첫 역의 순번을 구간마다 돌려준다(도보 구간은 뺀다)", () => {
    expect(boardingStopIndexes(option, stops)).toEqual([0, 3]);
  });

  it("역 목록과 맞지 않는 구간은 건너뛴다", () => {
    const mismatched = buildStops(option, ["a", "x", "y", "z"]);
    expect(boardingStopIndexes(option, mismatched)).toEqual([]);
  });
});

describe("nextBoardingIndex와 ridesBoardedBy", () => {
  it("탄 열차 수가 곧 다음에 탈 열차의 순서다", () => {
    expect(nextBoardingIndex([0, 3], 0)).toBe(0);
    expect(nextBoardingIndex([0, 3], 1)).toBe(3);
    expect(nextBoardingIndex([0, 3], 2)).toBeUndefined();
  });

  it("사용자가 알린 역 이하에서 타는 열차 수를 센다", () => {
    expect(ridesBoardedBy([0, 3], 0)).toBe(1);
    expect(ridesBoardedBy([0, 3], 2)).toBe(1);
    expect(ridesBoardedBy([0, 3], 4)).toBe(2);
  });
});

describe("needsWalkToStation", () => {
  const origin = { lat: 37.5, lng: 127.0 };
  const station = { lat: 37.5, lng: 127.01 };

  it("출발지가 좌표이고 탑승역에서 멀면 걸어야 한다", () => {
    expect(needsWalkToStation(origin, undefined, station, 250)).toBe(true);
  });

  it("위치를 알면 지금 위치로 거리를 잰다", () => {
    expect(needsWalkToStation(origin, { lat: 37.5, lng: 127.0099 }, station, 250)).toBe(false);
  });

  it("출발지가 역이면(좌표가 없으면) 걷는 단계가 없다", () => {
    expect(needsWalkToStation(undefined, { lat: 37.5, lng: 127.0 }, station, 250)).toBe(false);
  });

  it("탑승역 좌표를 모르면 걷는 단계를 만들지 않는다", () => {
    expect(needsWalkToStation(origin, undefined, undefined, 250)).toBe(false);
  });
});

describe("guidePhase", () => {
  const boardingIndexes = [0, 3];

  it("출발지가 멀면 처음에는 역까지 걷는 단계다", () => {
    expect(
      guidePhase({ boardingIndexes, state: { boardedRides: 0, stationReached: false }, currentIndex: 0, walkNeeded: true })
    ).toBe("WALK_TO_STATION");
  });

  it("역에 도착하면 승강장 대기다", () => {
    expect(
      guidePhase({ boardingIndexes, state: { boardedRides: 0, stationReached: true }, currentIndex: 0, walkNeeded: true })
    ).toBe("WAITING");
  });

  it("걸을 필요가 없으면 곧바로 승강장 대기다", () => {
    expect(
      guidePhase({ boardingIndexes, state: { boardedRides: 0, stationReached: false }, currentIndex: 0, walkNeeded: false })
    ).toBe("WAITING");
  });

  it("탔다고 확인하면 열차 이동이다", () => {
    expect(
      guidePhase({ boardingIndexes, state: { boardedRides: 1, stationReached: true }, currentIndex: 1, walkNeeded: false })
    ).toBe("RIDING");
  });

  it("환승역(다음 탑승역)에 닿기 전까지는 계속 열차 이동이다", () => {
    expect(
      guidePhase({ boardingIndexes, state: { boardedRides: 1, stationReached: true }, currentIndex: 2, walkNeeded: false })
    ).toBe("RIDING");
  });

  it("환승역에 닿으면 다시 승강장 대기다", () => {
    expect(
      guidePhase({ boardingIndexes, state: { boardedRides: 1, stationReached: true }, currentIndex: 3, walkNeeded: false })
    ).toBe("WAITING");
  });

  it("마지막 열차까지 탔으면 하차 때까지 열차 이동이다", () => {
    expect(
      guidePhase({ boardingIndexes, state: { boardedRides: 2, stationReached: true }, currentIndex: 4, walkNeeded: false })
    ).toBe("RIDING");
  });

  it("탑승역을 하나도 찾지 못한 경로는 단계를 나누지 않는다", () => {
    expect(
      guidePhase({ boardingIndexes: [], state: { boardedRides: 0, stationReached: false }, currentIndex: 0, walkNeeded: true })
    ).toBe("RIDING");
  });
});

describe("walkPhaseRemainingSec", () => {
  it("걷기 시작할 때는 걷는 시간을 포함한 전체 시간이다", () => {
    expect(walkPhaseRemainingSec(780, 1800, 0)).toBe(1800);
  });

  it("걷는 동안 지난 시간만큼 줄어든다", () => {
    expect(walkPhaseRemainingSec(780, 1800, 600)).toBe(1200);
  });

  it("열차 구간 시간 아래로는 내려가지 않는다", () => {
    expect(walkPhaseRemainingSec(780, 1800, 1700)).toBe(780);
  });

  it("지난 시간이 음수여도 전체 시간을 넘지 않는다", () => {
    expect(walkPhaseRemainingSec(780, 1800, -50)).toBe(1800);
  });
});
