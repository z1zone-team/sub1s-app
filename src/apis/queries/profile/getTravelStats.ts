import { get, type RequestOptions } from "@/apis/client";

export type TravelStatsPeriod = "WEEK" | "MONTH" | "YEAR" | "ALL";

export interface MostVisitedStationDto {
  stationId: string;
  stationName: string;
  visitCount: number;
}

export interface TravelStatsResponseDto {
  userId: string;
  period: TravelStatsPeriod;
  totalDistanceKm: number;
  totalTravelCount: number;
  transferCount: number;
  totalRideDurationSec: number;
  mostVisitedStations: MostVisitedStationDto[];
  mostUsedLineId?: string;
}

export interface TravelStatsQueryDto {
  period: TravelStatsPeriod;
  userId?: string;
}

/**
 * 사용자 지하철 주행 통계 조회
 * GET /api/v1/travel/stats
 */
export const getTravelStats = (
  query: TravelStatsQueryDto,
  options?: RequestOptions
): Promise<TravelStatsResponseDto> => {
  return get<TravelStatsResponseDto>("/travel/stats", query, options);
};
