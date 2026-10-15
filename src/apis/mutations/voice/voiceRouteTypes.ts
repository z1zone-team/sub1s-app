import type { RouteMode, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";

export interface InterpretedIntentDto {
  originStationName: string;
  destStationName: string;
  preferredMode: RouteMode;
  reason: string;
}

/** 경로를 찾은 결과. 서버가 `kind`를 주지 않는 이전 응답도 이것이다 */
export interface VoiceRouteRecommendResponseDto {
  kind?: "ROUTE";
  transcript: string;
  interpretedIntent: InterpretedIntentDto;
  recommendedRoute: SubwayRouteOptionDto;
  briefingText: string;
  audioTtsUrl?: string;
}

/** 서버가 해석한 출발지. 후보를 고른 뒤 경로를 검색할 때 그대로 쓴다. 역이면 `stationId`, 현재 위치나 장소면 좌표 */
export interface VoiceOriginDto {
  name: string;
  stationId?: string;
  lat?: number;
  lng?: number;
}

/** 도착지로 말한 이름의 후보. 역(`STATION`)이면 `stationId`, 장소(`PLACE`)면 주소와 가장 가까운 역을 가진다 */
export interface VoiceDestinationCandidateDto {
  type: "STATION" | "PLACE";
  name: string;
  address?: string;
  category?: string;
  lat: number;
  lng: number;
  stationId?: string;
  nearestStation?: {
    stationId: string;
    name: string;
    walkDistanceM: number;
    walkDurationSec: number;
  };
}

/** 후보가 여럿이라 "이 곳이 맞나요?"를 물어야 하는 결과. 경로는 아직 계산하지 않았다 */
export interface VoiceDestinationConfirmDto {
  kind: "CONFIRM_DESTINATION";
  transcript: string;
  interpretedIntent: InterpretedIntentDto;
  origin: VoiceOriginDto;
  candidates: VoiceDestinationCandidateDto[];
}

/** 음성 작업의 결과. 작업 조회와 소켓 `voice_result`가 같은 형태다 */
export type VoiceResultDto = VoiceRouteRecommendResponseDto | VoiceDestinationConfirmDto;

export const isDestinationConfirm = (result: VoiceResultDto): result is VoiceDestinationConfirmDto =>
  result.kind === "CONFIRM_DESTINATION";

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
