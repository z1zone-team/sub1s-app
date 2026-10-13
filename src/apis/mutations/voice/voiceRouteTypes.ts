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
  /** 출발지를 말하지 않았을 때 서버가 현재 위치로 쓴다. 둘 다 있을 때만 보낸다 */
  lat?: number;
  lng?: number;
}

/** 음성 요청의 multipart 본문. `POST /voice/jobs` 요청 본문이다 */
export function buildVoiceFormData(params: VoiceRouteRecommendRequest): FormData {
  const formData = new FormData();

  // React Native file object vs Web Blob/File 호환성 처리
  formData.append("file", params.audio as unknown as Blob);

  if (params.preferredMode) {
    formData.append("preferredMode", params.preferredMode);
  }
  if (Number.isFinite(params.lat) && Number.isFinite(params.lng)) {
    formData.append("lat", String(params.lat));
    formData.append("lng", String(params.lng));
  }
  return formData;
}
