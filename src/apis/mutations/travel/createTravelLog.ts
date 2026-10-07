import { post, type RequestOptions } from "@/apis/client";

export interface CreateTravelLogRequest {
  originStationId: string;
  destStationId: string;
  sessionId?: string;
}

export interface TravelLogResponse {
  logId: string;
  totalDistanceKm: number;
  transferCount: number;
  earnedPoints: number;
  currentTotalPoints: number;
}

/**
 * 이동 완료 기록 저장 및 포인트 적립 API (순수 함수)
 * POST /api/v1/travel/log
 */
export const createTravelLog = (
  body: CreateTravelLogRequest,
  options?: RequestOptions
): Promise<TravelLogResponse> => {
  return post<TravelLogResponse>("/travel/log", body, options);
};
