import { get, type RequestOptions } from "@/apis/client";

export interface FrequentRoutesQueryDto {
  /** 오늘(KST)을 포함해 며칠 전까지 볼지. 1~90, 기본 30 */
  days?: number;
  /** 1~10, 기본 3 */
  limit?: number;
}

export interface FrequentRouteDto {
  originStationId: string;
  originStationName: string;
  destStationId: string;
  destStationName: string;
  tripCount: number;
  /** 마지막으로 다닌 시각 (KST ISO) */
  lastTraveledAt: string;
}

export interface FrequentRoutesResponseDto {
  since: string;
  /** 2번 이상 다닌 경로만, 횟수가 많은 순(같으면 최근 순) */
  routes: FrequentRouteDto[];
}

/**
 * 최근 자주 다닌 출발·도착 역 쌍
 * GET /api/v1/travel/frequent-routes
 */
export const getFrequentRoutes = (
  query: FrequentRoutesQueryDto = {},
  options?: RequestOptions
): Promise<FrequentRoutesResponseDto> => {
  return get<FrequentRoutesResponseDto>("/travel/frequent-routes", query, options);
};
