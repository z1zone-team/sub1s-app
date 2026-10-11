import { post, type RequestOptions } from "@/apis/client";

export type RouteMode =
  | "OPTIMAL"
  | "COMFORTABLE"
  | "PERSONAL"
  | "CHEAPEST"
  | "ONLY_WALK";

export type CongestionLevel = "여유" | "보통" | "혼잡";

export type CongestionSource = "STATISTICS" | "MOCK";

/**
 * 서울교통공사 공지로 본 운행 상태.
 * NORMAL 공지된 이상 없음, DISRUPTED 지연·무정차·사고 공지가 걸림, UNKNOWN 알 수 없음 (표시하지 않는다)
 */
export type OperationStatus = "NORMAL" | "DISRUPTED" | "UNKNOWN";

export interface OperationNotice {
  title: string;
  /** 공지가 올라온 시각 (KST ISO) */
  occurredAt: string;
}

/** 옵션의 객관적 장점. 문구와 추천 배지는 앱이 사용자의 설문 답과 맞춰 정한다 */
export type RouteHighlight =
  | "FASTEST"
  | "FEWEST_TRANSFERS"
  | "NO_TRANSFER"
  | "LEAST_CROWDED"
  | "LEAST_WALK"
  | "CHEAPEST"
  | "WEAK_AC_CAR";

export interface PathSegmentDto {
  lineId: string; // 호선 ID 또는 'WALK'
  direction: "UP" | "DOWN" | "INNER" | "OUTER" | "NONE";
  isExpress: boolean;
  fromStationId: string;
  fromStationName: string;
  toStationId: string;
  toStationName: string;
  stationCount: number;
  durationSec: number;
  distanceKm: number;
  recommendedCarNo: number;
  /** 다음 환승에서 빨리 갈아탈 수 있는 문 ("칸-문", 예: "6-2") */
  recommendedDoors?: string[];
  isWeakAirConditioned: boolean;
  congestionLevel: CongestionLevel;
  congestionRate: number;
  /** STATISTICS 서울교통공사 공표 통계, MOCK 통계가 없는 역·시간대의 추정값. 도보 구간은 없다 */
  congestionSource?: CongestionSource;
  operationStatus: OperationStatus;
  operationNotice?: OperationNotice;
  isEstimated?: boolean;
  walkCalories?: number;
  walkSteps?: number;
}

export interface SubwayRouteOptionDto {
  mode: RouteMode;
  totalDurationSec: number;
  totalDistanceKm: number;
  totalFare: number;
  transferCount: number;
  estimatedArrivalTimestamp: string;
  segments: PathSegmentDto[];
  /** 지나가는 지하철역 ID 순서 (출발, 중간, 환승, 도착). ONLY_WALK에는 없다 */
  stationIds?: string[];
  highlights: RouteHighlight[];
  operationStatus: OperationStatus;
  operationNotice?: OperationNotice;
  totalWalkDurationSec?: number;
  totalWalkDistanceKm?: number;
  totalCalories?: number;
  totalSteps?: number;
}

export interface RouteSearchResult {
  options: SubwayRouteOptionDto[];
  aiBriefingText?: string;
}

export interface RouteSearchRequest {
  originStationId?: string;
  originLat?: number;
  originLng?: number;
  originName?: string;
  destinationStationId?: string;
  destinationLat?: number;
  destinationLng?: number;
  destinationName?: string;
  routeMode?: RouteMode;
  departureAt?: string;
}

/**
 * 다익스트라 기반 최적 지하철 및 도보 복합 경로 탐색
 * POST /api/v1/routes/search
 */
export const searchRoutes = (
  params: RouteSearchRequest,
  options?: RequestOptions
): Promise<RouteSearchResult> => {
  return post<RouteSearchResult>("/routes/search", params, options);
};
