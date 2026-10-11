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
