import { post, type RequestOptions } from "@/apis/client";

export type RouteMode = "OPTIMAL" | "COMFORTABLE" | "PERSONAL" | "CHEAPEST";
export type CongestionLevel = "여유" | "보통" | "혼잡";

export interface PathSegmentDto {
  lineId: string;
  direction: "UP" | "DOWN" | "INNER" | "OUTER";
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
}

export interface SubwayRouteOptionDto {
  mode: RouteMode;
  totalDurationSec: number;
  totalDistanceKm: number;
  totalFare: number;
  transferCount: number;
  estimatedArrivalTimestamp: string;
  segments: PathSegmentDto[];
}

export interface RouteSearchResult {
  options: SubwayRouteOptionDto[];
  aiBriefingText?: string;
}

export interface RouteSearchRequest {
  originStationId: string;
  destinationStationId: string;
  routeMode?: RouteMode;
  departureAt?: string;
}

/**
  * 다익스트라 기반 최적 지하철 경로 탐색
  * POST /api/v1/routes/search
  */
export const searchRoutes = (
  params: RouteSearchRequest,
  options?: RequestOptions
): Promise<RouteSearchResult> => {
  return post<RouteSearchResult>("/routes/search", params, options);
};
