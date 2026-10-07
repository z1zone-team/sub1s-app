import { post, type RequestOptions } from "@/apis/client";
import type {
  OffRouteAlert,
  TrackingSession,
} from "@/apis/queries/tracking/getTrackingSession";

export interface DeviateCheckRequest {
  sessionId: string;
  detectedStationId: string;
  currentStationId?: string; // 호환성 유지용 alias
  isUserConfirmed?: boolean;
}

export type DeviateCheckResponse = OffRouteAlert | TrackingSession;

/**
 * 경로 이탈 및 오탑승 감지 API (순수 함수, WebSocket Fallback)
 * POST /api/v1/routes/track/deviate
 */
export const checkDeviate = (
  body: DeviateCheckRequest,
  options?: RequestOptions
): Promise<DeviateCheckResponse> => {
  const payload = {
    sessionId: body.sessionId,
    detectedStationId: body.detectedStationId || body.currentStationId || "",
    isUserConfirmed: body.isUserConfirmed,
  };
  return post<DeviateCheckResponse>("/routes/track/deviate", payload, options);
};
