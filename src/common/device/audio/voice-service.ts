import { api, Envelope } from "../../../apis/client";

export interface InterpretedIntentDto {
  originStationName: string;
  destStationName: string;
  preferredMode: "OPTIMAL" | "COMFORTABLE" | "PERSONAL" | "CHEAPEST";
  reason: string;
}

export interface VoiceRouteRecommendResponseDto {
  transcript: string;
  interpretedIntent: InterpretedIntentDto;
  recommendedRoute: unknown;
  briefingText: string;
  audioTtsUrl?: string;
}

export interface UploadVoiceOptions {
  textHint?: string;
  signal?: AbortSignal;
}

/**
 * 녹음된 m4a 오디오 파일을 백엔드 음성 추천 API에 업로드 (multipart/form-data)
 */
export async function uploadVoiceRouteRecommend(
  audioUri: string,
  options?: UploadVoiceOptions
): Promise<VoiceRouteRecommendResponseDto> {
  if (!audioUri) {
    throw new Error("Audio URI is required for voice route recommendation.");
  }

  const formData = new FormData();
  formData.append("audio", {
    uri: audioUri,
    name: "voice_query.m4a",
    type: "audio/m4a",
  } as unknown as Blob);

  if (options?.textHint) {
    formData.append("textHint", options.textHint);
  }

  const response = await api.post<Envelope<VoiceRouteRecommendResponseDto>>(
    "/voice/route-recommend",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      signal: options?.signal,
    }
  );

  return response.data.data;
}
