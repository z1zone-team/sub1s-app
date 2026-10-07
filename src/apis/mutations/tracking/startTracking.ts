import { post, type RequestOptions } from "@/apis/client";
import type { TrackingSession } from "@/apis/queries/tracking/getTrackingSession";

export interface StartTrackingRequest {
  routeId: string;
  initialStationId: string;
}

/**
 * 실시간 주행 추적 세션 시작 API (순수 함수)
 * POST /api/v1/routes/track/start
 */
export const startTracking = (
  body: StartTrackingRequest,
  options?: RequestOptions
): Promise<TrackingSession> => {
  return post<TrackingSession>("/routes/track/start", body, options);
};
