import { ApiError } from "@/apis/client";
import type { RouteMode, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import type { RouteEndpoint } from "@/features/routing/endpoint";
import { WALK_LINE_ID } from "@/theme";

/** 이보다 짧게 녹음하면 말이 없었다고 보고 서버에 보내지 않는다 */
export const MIN_SPEECH_MS = 800;

export type VoiceFailure = "NO_SPEECH" | "NOT_FOUND" | "BUSY" | "LOGIN" | "GENERIC";

export function failureOf(error: unknown): VoiceFailure {
  if (error instanceof ApiError) {
    if (error.status === 401) return "LOGIN";
    if (error.status === 429) return "BUSY";
    if (error.status === 404) return "NOT_FOUND";
  }
  return "GENERIC";
}

export const FAILURE_TEXT: Record<VoiceFailure, { title: string; body: string }> = {
  NO_SPEECH: {
    title: "다시 말해 주세요",
    body: "말소리가 잘 들리지 않았어요. 조용한 곳에서 역 이름을 또박또박 말해 주세요.",
  },
  NOT_FOUND: {
    title: "역을 찾지 못했어요",
    body: "말씀하신 출발역이나 도착역을 찾지 못했어요. 역 이름을 또박또박 다시 말해 주세요.",
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
    body: "잠시 후 다시 시도하거나 글자로 검색해 주세요.",
  },
};

export const VOICE_EXAMPLES = ["강남역 가는 길", "집으로 가자"];

const MODE_REASON: Record<RouteMode, string> = {
  OPTIMAL: "가장 빠른 경로",
  COMFORTABLE: "여유로운 경로",
  PERSONAL: "취향에 맞춘 경로",
  CHEAPEST: "요금이 가장 적은 경로",
  ONLY_WALK: "걸어서 가는 경로",
};

export function modeReasonText(mode: RouteMode): string {
  return `${MODE_REASON[mode]}로 찾았어요`;
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
