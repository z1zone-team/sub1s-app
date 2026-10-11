import { post, type RequestOptions } from "@/apis/client";
import type { SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import type { TrackingSession } from "@/apis/queries/tracking/getTrackingSession";

export interface StartTrackingRequest {
  routeOption: SubwayRouteOptionDto;
  /** 서버가 경로에서 역 목록을 풀어 쓰지 않고 이 목록을 그대로 쓰게 할 때 */
  stationIds?: string[];
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
