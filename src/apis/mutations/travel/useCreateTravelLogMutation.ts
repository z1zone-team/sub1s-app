import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { post } from "@/apis/client";
import { queryKeys } from "@/constants/queryKeys";

export interface CreateTravelLogRequest {
  originStationId: string;
  destStationId: string;
  sessionId?: string;
}

export interface TravelLogResponse {
  logId: string;
  totalDistanceKm: number;
  transferCount: number;
  earnedPoints: number;
  currentTotalPoints: number;
}

/**
 * 이동 완료 기록 저장 및 포인트 적립 Mutation 훅
 * POST /api/v1/travel/log
 * 성공 시 profile/timeline, stats, ranking, auth/me 캐시를 무효화합니다.
 */
export const useCreateTravelLogMutation = (): UseMutationResult<
  TravelLogResponse,
  Error,
  CreateTravelLogRequest
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateTravelLogRequest) =>
      post<TravelLogResponse>("/travel/log", body),
    onSuccess: () => {
      // 내 정보, 타임라인, 통계, 랭킹 캐시 자동 갱신
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.ranking.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.linemap.all });
    },
  });
};
