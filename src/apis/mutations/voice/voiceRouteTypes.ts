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

/**
 * 출발지로 말한 이름의 후보가 여럿이라 "출발지가 맞나요?"를 물어야 하는 결과. 경로는 아직 계산하지 않았다.
 * 도착지가 정해졌으면 `destination`, 도착지도 후보가 여럿이면 `destinationCandidates`가 있다(둘 중 하나)
 */
export interface VoiceOriginConfirmDto {
  kind: "CONFIRM_ORIGIN";
  transcript: string;
  interpretedIntent: InterpretedIntentDto;
  originCandidates: VoiceDestinationCandidateDto[];
  destination?: VoiceOriginDto;
  destinationCandidates?: VoiceDestinationCandidateDto[];
}

/** 음성 작업의 결과. 작업 조회와 소켓 `voice_result`가 같은 형태다 */
export type VoiceResultDto = VoiceRouteRecommendResponseDto | VoiceDestinationConfirmDto | VoiceOriginConfirmDto;

export const isDestinationConfirm = (result: VoiceResultDto): result is VoiceDestinationConfirmDto =>
  result.kind === "CONFIRM_DESTINATION";

export const isOriginConfirm = (result: VoiceResultDto): result is VoiceOriginConfirmDto =>
  result.kind === "CONFIRM_ORIGIN";

export interface VoiceRouteRecommendRequest {
  /** 녹음 파일. 기기 음성 인식으로 받아 적은 문장(`transcriptHint`)만 보낼 때는 없다 */
  audio?: Blob | File | { uri: string; name: string; type: string };
  /** 기기에서 받아 적은 문장. 있으면 서버는 음성 인식을 건너뛴다(서버 #298부터 오디오 없이 받음) */
  transcriptHint?: string;
  preferredMode?: RouteMode;
  /** 출발지를 말하지 않았을 때 서버가 현재 위치로 쓴다. 둘 다 있을 때만 보낸다 */
  lat?: number;
  lng?: number;
}

/** 음성 요청의 multipart 본문. `POST /voice/jobs` 요청 본문이다 */
export function buildVoiceFormData(params: VoiceRouteRecommendRequest): FormData {
  const formData = new FormData();

  // React Native file object vs Web Blob/File 호환성 처리
  if (params.audio) formData.append("file", params.audio as unknown as Blob);
  const hint = params.transcriptHint?.trim();
  if (hint) formData.append("transcriptHint", hint);

  if (params.preferredMode) {
    formData.append("preferredMode", params.preferredMode);
  }
  if (Number.isFinite(params.lat) && Number.isFinite(params.lng)) {
    formData.append("lat", String(params.lat));
    formData.append("lng", String(params.lng));
  }
  return formData;
}
