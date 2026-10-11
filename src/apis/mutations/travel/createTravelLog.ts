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
  distancePoints: number;
  onTimeBonus: number;
  currentTotalPoints: number;
  monthlyTotalPoints: number;
  /** 세션이 확인될 때만 온다 */
  rideDurationSec?: number;
  /** 실제 소요 - 예정 소요(초). 음수면 일찍 도착 */
  arrivalDeltaSec?: number;
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
