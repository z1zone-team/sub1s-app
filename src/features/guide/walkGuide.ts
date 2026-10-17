export interface LatLng {
  lat: number;
  lng: number;
}

/** 도착지까지 이 거리(m) 안으로 오면 도착한 것으로 본다 */
export const WALK_ARRIVE_RADIUS_M = 50;
/** 서버가 준 소요 시간으로 속도를 알 수 없을 때 쓰는 걷는 속도(m/s) */
const FALLBACK_WALK_SPEED_MPS = 1.2;
const EARTH_RADIUS_M = 6_371_000;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/** 두 좌표 사이의 직선 거리(m) */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface WalkProgress {
  /** 도착지까지 남은 거리(m). 서버가 준 전체 거리가 있으면 그 기준으로 맞춘 값이라 경로 상세의 거리와 같은 기준이다 */
  remainingM: number;
  /** 남은 시간(초). 서버가 준 전체 소요 시간을 출발지와 도착지 사이 거리에 비례해 나눈다 */
  remainingSec: number;
  arrived: boolean;
}

interface WalkProgressInput {
  origin: LatLng;
  destination: LatLng;
  /** 내 위치. 아직 모르면 출발지에서 시작한 것으로 본다 */
  me?: LatLng;
  /** 서버가 준 도보 경로의 전체 소요 시간(초) */
  totalDurationSec: number;
  /** 서버가 준 도보 경로의 전체 거리(km). 있으면 남은 거리를 이 기준으로 보여 준다 */
  totalDistanceKm?: number;
  arriveRadiusM?: number;
}

/**
 * 도보 안내의 진행 상황. 내 위치에서 도착지까지의 직선 거리를 출발지에서 도착지까지의 직선 거리와 견줘
 * 남은 거리(서버가 준 전체 거리 기준)와 남은 시간(전체 소요 시간 기준)을 구한다.
 * 도착은 직선 거리로 판정하고, 위치를 모르면 도착으로 보지 않는다
 */
export function walkProgress({
  origin,
  destination,
  me,
  totalDurationSec,
  totalDistanceKm,
  arriveRadiusM = WALK_ARRIVE_RADIUS_M,
}: WalkProgressInput): WalkProgress {
  const totalM = distanceMeters(origin, destination);
  const straightRemainingM = distanceMeters(me ?? origin, destination);
  const secPerM =
    totalM > 0 && totalDurationSec > 0 ? totalDurationSec / totalM : 1 / FALLBACK_WALK_SPEED_MPS;
  const distanceScale = totalM > 0 && totalDistanceKm && totalDistanceKm > 0 ? (totalDistanceKm * 1000) / totalM : 1;

  return {
    remainingM: straightRemainingM * distanceScale,
    remainingSec: Math.round(straightRemainingM * secPerM),
    arrived: me !== undefined && straightRemainingM <= arriveRadiusM,
  };
}
