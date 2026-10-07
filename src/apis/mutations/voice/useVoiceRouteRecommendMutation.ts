import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import {
  recommendVoiceRoute,
  type InterpretedIntentDto,
  type VoiceRouteRecommendRequest,
  type VoiceRouteRecommendResponseDto,
} from "./recommendVoiceRoute";

export type {
  InterpretedIntentDto,
  VoiceRouteRecommendRequest,
  VoiceRouteRecommendResponseDto,
};

/**
 * AI 음성 경로 추천 및 자연어 브리핑 Mutation 훅
 * POST /api/v1/voice/route-recommend (multipart/form-data)
 */
export const useVoiceRouteRecommendMutation = (): UseMutationResult<
  VoiceRouteRecommendResponseDto,
  Error,
  VoiceRouteRecommendRequest
> => {
  return useMutation({
    mutationFn: (params: VoiceRouteRecommendRequest) =>
      recommendVoiceRoute(params),
  });
};
