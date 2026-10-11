import { post, type RequestOptions } from "@/apis/client";
import type { OffRouteAlert, TrackingSession } from "@/apis/queries/tracking/getTrackingSession";

export interface ReportPositionRequest {
  sessionId: string;
  lat: number;
  lng: number;
}

export type ReportPositionResponse = TrackingSession | OffRouteAlert;

/**
 * GPS 좌표로 위치 확인과 경로 이탈 감지
 * POST /api/v1/routes/track/position
 * - 경로 위면 세션을, 경로에 없는 역이 연속으로 감지되면 회차 경로가 담긴 이탈 알림을 돌려준다
 */
export const reportPosition = (
  body: ReportPositionRequest,
  options?: RequestOptions
): Promise<ReportPositionResponse> => {
  return post<ReportPositionResponse>("/routes/track/position", body, options);
};
