import type { OffRouteAlert, TrackingSession } from "@/apis/queries/tracking/getTrackingSession";

/** 위치 보고의 응답이 이탈 알림인지. 이탈 알림에만 회차 경로가 있다 */
export function isOffRouteAlert(response: TrackingSession | OffRouteAlert): response is OffRouteAlert {
  return "rerouteOption" in response && response.rerouteOption !== undefined;
}

/**
 * 새 경로가 원래 경로보다 얼마나 늦게 도착하는지. 새 경로의 전체 소요 시간과
 * 원래 경로에서 남아 있던 시간의 차이를 분 단위로 보여 준다
 */
export function delayText(newTotalSec: number, previousRemainingSec: number): string {
  const minutes = Math.round((newTotalSec - previousRemainingSec) / 60);
  if (minutes === 0) return "예정과 비슷해요";
  return minutes > 0 ? `+${minutes}분` : `${-minutes}분 빨라요`;
}

/** 지연 문구와, 새 경로가 더 늦은지 (늦으면 빨간색으로 강조한다) */
export function delayParts(newTotalSec: number, previousRemainingSec: number): { text: string; late: boolean } {
  return {
    text: delayText(newTotalSec, previousRemainingSec),
    late: Math.round((newTotalSec - previousRemainingSec) / 60) > 0,
  };
}

/** 사용자가 "맞게 탔어요"를 눌렀으면 경로 위의 역이 다시 확인될 때까지 같은 알림을 띄우지 않는다 */
export function shouldShowAlert(dismissed: boolean): boolean {
  return !dismissed;
}
