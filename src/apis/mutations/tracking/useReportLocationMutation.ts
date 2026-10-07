import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { post } from "@/apis/client";
import { queryKeys } from "@/constants/queryKeys";
import type { TrackingSession } from "@/apis/queries/tracking/getTrackingSession";

export interface ReportLocationRequest {
  sessionId: string;
  currentStationId: string;
}

/**
 * 실시간 정차역 위치 보고 및 세션 갱신 Mutation 훅
 * POST /api/v1/routes/track/location
 */
export const useReportLocationMutation = (): UseMutationResult<
  TrackingSession,
  Error,
  ReportLocationRequest
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ReportLocationRequest) =>
      post<TrackingSession>("/routes/track/location", body),
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.tracking.session(data.sessionId),
        data
      );
    },
  });
};
