import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import {
  createTravelLog,
  type CreateTravelLogRequest,
  type TravelLogResponse,
} from "./createTravelLog";

export type { CreateTravelLogRequest, TravelLogResponse };

/**
 * 이동 완료 기록 저장 및 포인트 적립 Mutation 훅
 * POST /api/v1/travel/log
 * 성공 시 profile/timeline, stats, ranking, auth/me, linemap 캐시를 무효화합니다.
 */
export const useCreateTravelLogMutation = (): UseMutationResult<
  TravelLogResponse,
  Error,
  CreateTravelLogRequest
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateTravelLogRequest) => createTravelLog(body),
    onSuccess: () => {
      // 내 정보, 타임라인, 통계, 랭킹, 노선도 캐시 자동 갱신
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.ranking.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.linemap.all });
    },
  });
};
