import type { VoiceRouteRecommendResponseDto } from "@/apis/mutations/voice/voiceRouteTypes";
import { getPlaces } from "@/apis/queries/users/places";
import { placeOfKind, placeToEndpoint } from "@/features/places/placeEndpoint";
import type { RouteEndpoint } from "@/features/routing/endpoint";
import { endpointsOfOption } from "./voiceView";

/** 집·학교는 마지막 하차역 대신 저장한 장소 자체를 최근 도착지로 남긴다. */
export async function saveVoiceDestination(
  data: VoiceRouteRecommendResponseDto,
  save: (destination: RouteEndpoint) => Promise<void>
): Promise<void> {
  const name = data.interpretedIntent.destStationName;
  const kind = name === "집" ? "HOME" : name === "학교" ? "SCHOOL" : undefined;
  if (kind) {
    try {
      const place = placeOfKind(await getPlaces(), kind);
      if (place) await save(placeToEndpoint(place));
    } catch {
      // 최근 기록 조회 실패가 이미 성공한 음성 결과를 실패로 바꾸면 안 된다.
    }
    return;
  }
  const endpoints = endpointsOfOption(data.recommendedRoute);
  if (endpoints) await save(endpoints.destination);
}
