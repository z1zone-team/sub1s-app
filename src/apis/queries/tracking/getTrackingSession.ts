import { get, type RequestOptions } from "@/apis/client";
import type { SubwayRouteOptionDto } from "../routing/searchRoutes";

export interface TrackingSession {
  sessionId: string;
  currentStationId: string;
  currentStationName: string;
  nextStationId: string;
  nextStationName: string;
  destStationId: string;
  destStationName: string;
  /** 시작할 때의 경로 전체 소요 시간이고 줄어들지 않는다. 남은 시간은 앱이 계산한다 */
  remainingDurationSec: number;
  isOffRoute: boolean;
  /** 현재 역 다음부터 도착역까지 남은 역 ID */
  expectedRemainingStationIds: string[];
}

export type OffRouteReason = "WRONG_DIRECTION" | "SKIPPED_TRANSFER";

export interface OffRouteAlert {
  sessionId: string;
  detectedStationId: string;
  detectedStationName: string;
  reason: OffRouteReason;
  message: string;
  rerouteOption: SubwayRouteOptionDto;
  isOffRoute: true;
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
