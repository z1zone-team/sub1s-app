import { formatClockKst, formatDistanceKm, formatDurationSec } from "@/common/utils/format";
import type { NextTrain, NextTrainsResult } from "@/apis/queries/stations/getNextTrains";
import type { GuidePhase } from "./guidePhase";
import type { UpcomingAction } from "./progress";

/** 다음 환승이나 하차를 안내하는 한 줄. 가까워질수록 구체적으로 말한다 */
export function upcomingMessage(action: UpcomingAction | null, stationName: string): string {
  if (!action) return "";
  if (action.kind === "ALIGHT") {
    return action.stopsAway === 1
      ? `다음 역 ${stationName}, 내릴 준비하세요`
      : `${stationName}에서 내려요 · ${action.stopsAway}개 역 남음`;
  }
  return action.stopsAway === 1
    ? `다음 역 ${stationName}에서 갈아타세요`
    : `${stationName}에서 갈아타요 · ${action.stopsAway}개 역 남음`;
}

/** "31분 남음 · 오후 2:51 도착" */
export function remainingText(remainingSec: number, nowMs: number): string {
  if (remainingSec <= 0) return "곧 도착해요";
  return `${formatDurationSec(remainingSec)} 남음 · ${formatClockKst(nowMs + remainingSec * 1000)} 도착`;
}

/** 큰 글자와 작은 글자로 나눠 그리는 "31분" / "남음 · 오후 2:51 도착". 곧 도착이면 "곧" / "도착해요" */
export function remainingParts(remainingSec: number, nowMs: number): { amount: string; rest: string } {
  if (remainingSec <= 0) return { amount: "곧", rest: "도착해요" };
  return {
    amount: formatDurationSec(remainingSec),
    rest: `남음 · ${formatClockKst(nowMs + remainingSec * 1000)} 도착`,
  };
}

/** 홈 복귀 버튼에 보이는 남은 분. 1분 미만이어도 1분으로 보여 준다 */
export function minutesLabel(remainingSec: number): string {
  return `${Math.max(1, Math.round(remainingSec / 60))}분`;
}

/** 예정보다 얼마나 빨랐는지. 값이 없으면 보여 주지 않는다 */
export function arrivalDeltaText(deltaSec: number | undefined): string {
  if (deltaSec === undefined || !Number.isFinite(deltaSec)) return "";
  if (Math.abs(deltaSec) < 30) return "예정대로 도착";
  const minutes = Math.max(1, Math.round(Math.abs(deltaSec) / 60));
  return deltaSec < 0 ? `${minutes}분 일찍 도착` : `${minutes}분 늦게 도착`;
}

/** 배너 맨 위 작은 글자. 걷는 중과 기다리는 중에는 "다음 역"이 아니라 탈 역을 가리킨다 */
export function phaseBannerLabel(phase: GuidePhase): string {
  if (phase === "WALK_TO_STATION") return "걸어갈 역";
  if (phase === "WAITING") return "탈 역";
  return "다음 역";
}

/** 걷는 중과 기다리는 중의 안내 제목. 열차를 타는 중에는 쓰지 않는다 */
export function phaseTitle(phase: GuidePhase, stationName: string): string {
  const name = stationName || "탑승역";
  return phase === "WALK_TO_STATION" ? `${name}까지 걸어가요` : `${name} 승강장에서 기다려요`;
}

/** 첫 탑승역까지 남은 거리. 모르면 빈 문자열 */
export function walkDetail(distanceM: number | undefined): string {
  if (distanceM === undefined || !Number.isFinite(distanceM)) return "";
  return `약 ${formatDistanceKm(Math.max(0, distanceM) / 1000)} 남았어요`;
}

/** 승강장에서 탈 열차 설명: "2호선 · 건대입구역까지" */
export function rideDetail(lineName: string, toStationName: string): string {
  return [lineName, toStationName ? `${toStationName}까지` : ""].filter(Boolean).join(" · ");
}

/**
 * 탈 역의 다음 열차 한 줄: "판교 방면 · 5분 후 출발". 실시간이면 "도착", 시각표면 "출발"이다.
 * 남은 시간은 서버 응답 시점 기준이라 응답 뒤로 흐른 시간(elapsedSec)을 빼고, 모르면 빈 문자열이다
 */
export function nextTrainText(
  train: Pick<NextTrain, "headsign" | "arrivalInSec"> | undefined,
  source: NextTrainsResult["source"],
  elapsedSec = 0
): string {
  if (!train || train.arrivalInSec === null) return "";
  const verb = source === "REALTIME" ? "도착" : "출발";
  const remaining = train.arrivalInSec - Math.max(0, elapsedSec);
  const when = remaining < 60 ? `곧 ${verb}` : `${Math.ceil(remaining / 60)}분 후 ${verb}`;
  return train.headsign ? `${train.headsign} 방면 · ${when}` : when;
}
