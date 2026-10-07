import { get, type RequestOptions } from "@/apis/client";
import type { SubwayRouteOptionDto } from "../routing/searchRoutes";

export type TrackingStatus =
  | "WAITING"
  | "IN_TRANSIT"
  | "TRANSFERRING"
  | "ARRIVED"
  | "OFF_ROUTE";

export interface TrackingSession {
  sessionId: string;
  routeId: string;
  currentStationId: string;
  nextStationId?: string;
  status: TrackingStatus;
  currentSegmentIndex: number;
  startedAt: string;
  updatedAt: string;
  estimatedArrivalTimestamp?: string;
}

export interface OffRouteAlert {
  isOffRoute: boolean;
  sessionId: string;
  detectedStationId: string;
  reason: string;
  recommendedRecoveryRoute?: SubwayRouteOptionDto;
}

/**
 * 실시간 주행 추적 세션 상태 조회
 * GET /api/v1/routes/track/:sessionId
 */
export const getTrackingSession = (
  sessionId: string,
  options?: RequestOptions
): Promise<TrackingSession> => {
  return get<TrackingSession>(`/routes/track/${sessionId}`, undefined, options);
};
