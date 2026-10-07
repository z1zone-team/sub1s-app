import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { post } from "@/apis/client";
import type {
  OffRouteAlert,
  TrackingSession,
} from "@/apis/queries/tracking/getTrackingSession";

export interface DeviateCheckRequest {
  sessionId: string;
  currentStationId: string;
  currentLat?: number;
  currentLng?: number;
}

export type DeviateCheckResponse = OffRouteAlert | TrackingSession;

/**
 * 경로 이탈 및 오탑승 감지 Mutation 훅 (WebSocket Fallback)
 * POST /api/v1/routes/track/deviate
 */
export const useDeviateCheckMutation = (): UseMutationResult<
  DeviateCheckResponse,
  Error,
  DeviateCheckRequest
> => {
  return useMutation({
    mutationFn: (body: DeviateCheckRequest) =>
      post<DeviateCheckResponse>("/routes/track/deviate", body),
  });
};
