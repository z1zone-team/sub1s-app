import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { post } from "@/apis/client";
import { queryKeys } from "@/constants/queryKeys";
import type { TrackingSession } from "@/apis/queries/tracking/getTrackingSession";

export interface StartTrackingRequest {
  routeId: string;
  initialStationId: string;
}

/**
 * 실시간 주행 추적 세션 시작 Mutation 훅
 * POST /api/v1/routes/track/start
 */
export const useStartTrackingMutation = (): UseMutationResult<
  TrackingSession,
  Error,
  StartTrackingRequest
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: StartTrackingRequest) =>
      post<TrackingSession>("/routes/track/start", body),
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.tracking.session(data.sessionId),
        data
      );
    },
  });
};
