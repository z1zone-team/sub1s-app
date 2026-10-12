import { formatClockKst, formatDurationSec } from "@/common/utils/format";
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
