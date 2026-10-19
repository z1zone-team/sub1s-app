import type { ServiceWarning } from "@/apis/queries/routing/searchRoutes";
import { departureText } from "./departureTime";

export interface ServiceWarningView {
  title: string;
  detail: string;
  /** 다음 첫차에 맞춰 다시 찾을 수 있을 때만 있다. departureMs는 그 출발 시각 */
  retry?: { label: string; departureMs: number };
}

/** "오늘 05:36", "내일 05:36", 그보다 뒤면 "10월 22일 05:36" */
function dayClock(ms: number, nowMs: number): string {
  return departureText(ms, nowMs).replace(/ 출발$/, "");
}

/**
 * 경로의 탑승역에 탈 열차가 없을 때의 경고 문구. 막차가 떠났으면 다음 첫차를, 첫차 전이면 그날 첫차를 알려 주고,
 * 그 첫차에 맞춘 출발 시각으로 다시 찾는 버튼을 준다
 */
export function serviceWarningView(warning: ServiceWarning, nowMs: number): ServiceWarningView {
  const station = `${warning.stationName}역`;
  const title = warning.status === "AFTER_LAST_TRAIN" ? `${station} 막차가 끊겼어요` : `${station} 첫차 전이에요`;

  const nextMs = warning.nextTrainAt ? Date.parse(warning.nextTrainAt) : Number.NaN;
  const detail = Number.isNaN(nextMs) ? "이 시각에는 탈 수 있는 열차가 없어요" : `다음 첫차는 ${dayClock(nextMs, nowMs)}에 있어요`;

  const suggestedMs = warning.suggestedDepartureAt ? Date.parse(warning.suggestedDepartureAt) : Number.NaN;
  // 이미 지난 시각으로는 다시 찾을 수 없다
  if (Number.isNaN(suggestedMs) || suggestedMs < nowMs) return { title, detail };
  return { title, detail, retry: { label: `${departureText(suggestedMs, nowMs)}로 다시 찾기`, departureMs: suggestedMs } };
}
