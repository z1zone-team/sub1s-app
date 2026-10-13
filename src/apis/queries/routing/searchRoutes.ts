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

/** 칸 하나의 예측 혼잡도(번호는 1부터 그 열차의 칸 수까지, 호선마다 다르다) */
export interface SegmentCar {
  carNo: number;
  /** 0~100 */
  rate: number;
  level: CongestionLevel;
  isWeakAirConditioned: boolean;
}

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
  /** 이 구간 출발역의 칸별 예측 혼잡도. 추천 칸은 이 중 가장 한산한 칸. 도보 구간과 구버전 서버에는 없다 */
  cars?: SegmentCar[];
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

/** 서버가 추천(PERSONAL)의 가중치를 만든 근거. 로그인한 사용자에게만 온다 (API_SPEC 2.2) */
export interface RecommendationMeta {
  /** 출발 시각의 상황: WEEKDAY_MORNING_RUSH, WEEKDAY_MIDDAY, WEEKDAY_EVENING_RUSH, WEEKDAY_NIGHT, LATE_NIGHT, EARLY_MORNING, WEEKEND_DAYTIME, WEEKEND_OTHER */
  context: string;
  /** 근거 코드: PREF_*(설문), PURPOSE_*(이동 목적), CONTEXT_*(시간대), HISTORY_*(이전에 고른 모드) */
  reasons: string[];
  usedHistory: boolean;
  /** 최소 비용을 자주 골랐는가. 서버 엔진은 요금을 가중치로 다루지 못해 앱이 후보를 고를 때 더 본다 */
  fareSensitive: boolean;
  weights: { congestion: number; transferSec: number };
}

export interface RouteSearchResult {
  options: SubwayRouteOptionDto[];
  aiBriefingText?: string;
  recommendation?: RecommendationMeta;
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
