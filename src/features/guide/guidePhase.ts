import type { SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { WALK_LINE_ID } from "@/theme";
import { distanceMeters, type Coordinate, type Stop } from "./progress";

/** 안내의 지금 단계. 걷는 중, 승강장에서 기다리는 중, 열차를 타고 가는 중 */
export type GuidePhase = "WALK_TO_STATION" | "WAITING" | "RIDING";

/** 안내 화면이 기억하는 단계 상태. 홈에 다녀와도 이어지도록 진행 중 안내 저장소에 둔다 */
export interface PhaseState {
  /** 지금까지 탔다고 확인한 열차 수 */
  boardedRides: number;
  /** 첫 탑승역에 도착했다고 확인했는지(위치로 알았거나 사용자가 알려 줌) */
  stationReached: boolean;
}

export const INITIAL_PHASE_STATE: PhaseState = { boardedRides: 0, stationReached: false };

/** 각 열차를 타는 역의 순번. 탑승 구간(도보가 아닌 구간)마다 그 구간이 출발하는 첫 역이다 */
export function boardingStopIndexes(option: SubwayRouteOptionDto, stops: Stop[]): number[] {
  const indexes: number[] = [];
  option.segments.forEach((segment, segmentIndex) => {
    if (segment.lineId === WALK_LINE_ID) return;
    const index = stops.findIndex((stop) => stop.segmentIndex === segmentIndex);
    if (index >= 0) indexes.push(index);
  });
  return indexes;
}

/** 아직 타지 않은 다음 열차를 타는 역의 순번. 모두 탔으면 없다 */
export function nextBoardingIndex(boardingIndexes: number[], boardedRides: number): number | undefined {
  return boardingIndexes[boardedRides];
}

/** 이 순번 이하의 역에서 타는 열차 수. 사용자가 더 뒤의 역에 있다고 알리면 그만큼 탄 것으로 본다 */
export function ridesBoardedBy(boardingIndexes: number[], stopIndex: number): number {
  return boardingIndexes.filter((index) => index <= stopIndex).length;
}

/**
 * 안내가 첫 탑승역까지 걷는 단계를 보여야 하는지. 지금 위치(GPS)를 알면 출발지 종류와 상관없이 그 위치가 첫 탑승역에서 기준 거리보다 먼지로 정한다.
 * 위치를 모르면 출발지 좌표(현재 위치나 장소)로 재고, 출발지가 역이라 좌표도 없으면 역에 있다고 본다
 */
export function needsWalkToStation(
  originCoords: Coordinate | undefined,
  position: Coordinate | undefined,
  station: Coordinate | undefined,
  radiusM: number
): boolean {
  const from = position ?? originCoords;
  if (!from || !station) return false;
  return distanceMeters(from, station) > radiusM;
}

interface PhaseInput {
  boardingIndexes: number[];
  state: PhaseState;
  /** 진행 계산이 낸 지금 역의 순번(탑승역에서 멈춘 값) */
  currentIndex: number;
  walkNeeded: boolean;
}

export function guidePhase({ boardingIndexes, state, currentIndex, walkNeeded }: PhaseInput): GuidePhase {
  const gate = nextBoardingIndex(boardingIndexes, state.boardedRides);
  if (gate === undefined) return "RIDING";
  if (state.boardedRides === 0 && walkNeeded && !state.stationReached) return "WALK_TO_STATION";
  return currentIndex >= gate ? "WAITING" : "RIDING";
}

/**
 * 첫 탑승역까지 걷는 동안의 남은 시간. 진행 계산은 열차 구간만 세므로 걷는 시간이 빠진다.
 * 걷는 구간만 따로 알 수 없어, 전체 소요 시간에서 안내를 시작한 뒤 지난 시간을 뺀 값을 쓰되 열차 구간 시간 아래로는 내려가지 않는다.
 */
export function walkPhaseRemainingSec(rideRemainingSec: number, totalDurationSec: number, elapsedSec: number): number {
  return Math.max(rideRemainingSec, Math.round(totalDurationSec - Math.max(0, elapsedSec)));
}
