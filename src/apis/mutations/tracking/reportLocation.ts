import { post, type RequestOptions } from "@/apis/client";
import type { TrackingSession } from "@/apis/queries/tracking/getTrackingSession";

export interface ReportLocationRequest {
  sessionId: string;
  currentStationId: string;
}

/**
 * 실시간 정차역 위치 보고 및 세션 갱신 API (순수 함수)
 * POST /api/v1/routes/track/location
 */
export const reportLocation = (
  body: ReportLocationRequest,
  options?: RequestOptions
): Promise<TrackingSession> => {
  return post<TrackingSession>("/routes/track/location", body, options);
};
