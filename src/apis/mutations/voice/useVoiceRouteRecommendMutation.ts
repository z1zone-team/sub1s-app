import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { postMultipart } from "@/apis/client";
import type { RouteMode, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";

export interface InterpretedIntentDto {
  originStationName: string;
  destStationName: string;
  preferredMode: RouteMode;
  reason: string;
}

export interface VoiceRouteRecommendResponseDto {
  transcript: string;
  interpretedIntent: InterpretedIntentDto;
  recommendedRoute: SubwayRouteOptionDto;
  briefingText: string;
  audioTtsUrl?: string;
}

export interface VoiceRouteRecommendRequest {
  audio: Blob | File | { uri: string; name: string; type: string };
  preferredMode?: RouteMode;
}

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
    mutationFn: async ({ audio, preferredMode }) => {
      const formData = new FormData();

      // React Native file object vs Web Blob/File 호환성 처리
      formData.append("file", audio as unknown as Blob);

      if (preferredMode) {
        formData.append("preferredMode", preferredMode);
      }

      return postMultipart<VoiceRouteRecommendResponseDto>(
        "/voice/route-recommend",
        formData
      );
    },
  });
};
