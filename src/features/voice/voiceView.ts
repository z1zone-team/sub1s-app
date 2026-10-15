import { ApiError } from "@/apis/client";
import { VoiceJobFailedError } from "./voiceJob";
import type { VoiceDestinationCandidateDto, VoiceOriginDto } from "@/apis/mutations/voice/voiceRouteTypes";
import type { RouteMode, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import type { RouteEndpoint } from "@/features/routing/endpoint";
import { WALK_LINE_ID } from "@/theme";

/** 이보다 짧게 녹음하면 말이 없었다고 보고 서버에 보내지 않는다 */
export const MIN_SPEECH_MS = 800;

export type VoiceFailure =
  | "NO_SPEECH"
  | "NOT_FOUND"
  | "ORIGIN_REQUIRED"
  | "PLACE_NOT_SAVED"
  | "TOO_LONG"
  | "UNAVAILABLE"
  | "BUSY"
  | "LOGIN"
  | "GENERIC";

/**
 * 요청이 거절된 오류(`ApiError`)와 작업이 실패했다는 알림(`VoiceJobFailedError`)은 같은 코드, 상태를 쓴다.
 * 서버가 상태로 구분해 주므로 상태로 화면을 고른다
 */
export function failureOf(error: unknown): VoiceFailure {
  if (error instanceof ApiError || error instanceof VoiceJobFailedError) {
    // 같은 422라도 말소리가 없었다는 것은 출발역 안내가 아니라 다시 말해 달라는 안내다
    if (error.code === "VOICE_NO_SPEECH") return "NO_SPEECH";
    // 말은 들었는데 어디로 가는지 알아듣지 못한 것은 출발역을 더하라는 안내가 아니라 다시 말해 달라는 안내다
    if (error.code === "VOICE_INTENT_NOT_UNDERSTOOD") return "NOT_FOUND";
    // 집이나 학교를 말했는데 저장한 적이 없다
    if (error.code === "VOICE_PLACE_NOT_SAVED") return "PLACE_NOT_SAVED";
    if (error.status === 401) return "LOGIN";
    if (error.status === 429) return "BUSY";
    if (error.status === 404) return "NOT_FOUND";
    if (error.status === 422) return "ORIGIN_REQUIRED";
    if (error.status === 413) return "TOO_LONG";
    if (error.status === 503) return "UNAVAILABLE";
  }
  return "GENERIC";
}

export const FAILURE_TEXT: Record<VoiceFailure, { title: string; body: string }> = {
  NO_SPEECH: {
    title: "다시 말씀해 주세요",
    body: "말소리가 잘 들리지 않았어요. 조용한 곳에서 역 이름을 또박또박 말씀해 주세요.",
  },
  NOT_FOUND: {
    title: "역을 찾지 못했어요",
    body: "말씀하신 출발역이나 도착역을 찾지 못했어요. 역 이름을 또박또박 다시 말씀해 주세요.",
  },
  ORIGIN_REQUIRED: {
    title: "어디서 출발할까요?",
    body: "출발역을 함께 말씀해 주세요. 예를 들어 “가양에서 강남까지”처럼 말씀해 주세요.",
  },
  PLACE_NOT_SAVED: {
    title: "집이나 학교를 먼저 저장해 주세요",
    body: "홈 화면의 집, 학교 버튼을 눌러 장소를 저장하면 “집으로 가자”처럼 말씀하실 수 있어요.",
  },
  TOO_LONG: {
    title: "말씀이 너무 길어요",
    body: "조금 짧게 나눠서 다시 말씀해 주세요.",
  },
  UNAVAILABLE: {
    title: "지금은 음성 검색을 쓸 수 없어요",
    body: "음성을 처리하는 곳이 바빠요. 잠시 후 다시 시도하거나 글자로 찾아 주세요.",
  },
  BUSY: {
    title: "잠시 후에 다시 해 주세요",
    body: "방금 보낸 요청을 처리하고 있어요. 몇 초 뒤에 다시 시도해 주세요.",
  },
  LOGIN: {
    title: "로그인이 필요해요",
    body: "음성 검색은 로그인한 뒤에 쓸 수 있어요.",
  },
  GENERIC: {
    title: "음성을 처리하지 못했어요",
    body: "잠시 후 다시 시도하거나 글자로 찾아 주세요.",
  },
};

export const VOICE_EXAMPLES = ["강남역 가는 길", "집으로 가자"];

const MODE_REASON: Record<RouteMode, string> = {
  OPTIMAL: "종합 최적 경로",
  COMFORTABLE: "여유로운 경로",
  PERSONAL: "취향에 맞춘 경로",
  CHEAPEST: "요금이 가장 적은 경로",
  ONLY_WALK: "걸어서 가는 경로",
  FASTEST: "소요시간이 가장 짧은 경로",
  LEAST_WALK: "도보거리가 가장 짧은 경로",
  FEWEST_TRANSFERS: "환승이 가장 적은 경로",
};

/** 결과 화면에서 굵게 보이는 경로 종류 ("취향에 맞춘 경로") */
export function modeLabel(mode: RouteMode): string {
  return MODE_REASON[mode];
}

export function modeReasonText(mode: RouteMode): string {
  return `${MODE_REASON[mode]}로 찾았어요`;
}

/** 추천 경로의 마지막 탑승 호선. 결과 화면의 "가양 → 강남 [2]" 칩에 호선 배지로 붙는다. 탑승 구간이 없으면 undefined */
export function destinationLineId(option: SubwayRouteOptionDto): string | undefined {
  const rides = option.segments.filter((segment) => segment.lineId !== WALK_LINE_ID);
  return rides[rides.length - 1]?.lineId;
}

/** 프로토타입 Voice.dc.html의 파형 막대 높이(px) 24개 */
export const WAVE_HEIGHTS = [18, 34, 52, 30, 64, 80, 46, 70, 92, 58, 40, 76, 88, 50, 66, 36, 72, 54, 28, 60, 44, 24, 38, 16];

/** 파형 막대마다 시작이 조금씩 어긋나도록 (i x 0.07) % 0.9 초 늦춘다 */
export function waveDelayMs(index: number): number {
  return Math.round(((index * 0.07) % 0.9) * 1000);
}

/** 추천 경로의 첫 탑승역과 마지막 도착역으로 출발지와 도착지를 만든다. 경로 상세가 이 두 값을 받는다 */
export function endpointsOfOption(option: SubwayRouteOptionDto): {
  origin: RouteEndpoint;
  destination: RouteEndpoint;
} | null {
  const rides = option.segments.filter((segment) => segment.lineId !== WALK_LINE_ID);
  if (rides.length === 0) return null;
  const first = rides[0];
  const last = rides[rides.length - 1];
  return {
    origin: { name: first.fromStationName, stationId: first.fromStationId },
    destination: { name: last.toStationName, stationId: last.toStationId },
  };
}

/** 서버가 해석한 출발지를 경로 검색 출발지로 바꾼다. 역도 좌표도 없으면 null */
export function originToEndpoint(origin: VoiceOriginDto): RouteEndpoint | null {
  if (origin.stationId) return { name: origin.name, stationId: origin.stationId };
  if (Number.isFinite(origin.lat) && Number.isFinite(origin.lng)) {
    return { name: origin.name, lat: origin.lat, lng: origin.lng };
  }
  return null;
}

/** 고른 후보를 경로 검색 도착지로 바꾼다. 역이면 역 ID로, 장소이면 좌표와 이름으로 찾는다 */
export function candidateToEndpoint(candidate: VoiceDestinationCandidateDto): RouteEndpoint {
  if (candidate.type === "STATION" && candidate.stationId) {
    return { name: candidate.name, stationId: candidate.stationId };
  }
  return { name: candidate.name, lat: candidate.lat, lng: candidate.lng };
}

/** 후보 아래에 보여 줄 줄. 장소는 주소, 역은 "지하철역" */
export function candidateAddress(candidate: VoiceDestinationCandidateDto): string {
  if (candidate.type === "STATION") return "지하철역";
  return candidate.address ?? "";
}

/** 장소 후보에서 가장 가까운 역까지의 걸음: "가좌역에서 걸어서 12분". 역 후보와 정보가 없으면 null */
export function candidateNearestText(candidate: VoiceDestinationCandidateDto): string | null {
  const nearest = candidate.nearestStation;
  if (candidate.type !== "PLACE" || !nearest) return null;
  const minutes = Math.max(1, Math.round(nearest.walkDurationSec / 60));
  return `${nearest.name}역에서 걸어서 ${minutes}분`;
}
