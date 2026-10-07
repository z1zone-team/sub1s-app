import { post, type RequestOptions } from "@/apis/client";

export type RouteMode =
  | "OPTIMAL"
  | "COMFORTABLE"
  | "PERSONAL"
  | "CHEAPEST"
  | "ONLY_WALK";

export type CongestionLevel = "여유" | "보통" | "혼잡";

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
  isWeakAirConditioned: boolean;
  congestionLevel: CongestionLevel;
  congestionRate: number;
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
