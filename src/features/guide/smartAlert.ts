import type { SmartAlertPayload, SmartAlertType } from "@/common/realtime/types";
import { describeDoor } from "@/features/routing/routeView";

/** 안내 배너에 서버 알림을 보여 주는 시간 */
export const SMART_ALERT_BANNER_MS = 8000;

/** 알림 채널을 고르는 종류. 환승 알림 둘은 환승 채널, 하차는 하차 채널을 쓴다 */
export type SmartAlertKind = "TRANSFER" | "ALIGHT";

export function smartAlertKind(type: SmartAlertType): SmartAlertKind {
  return type === "ALIGHT_PREPARE" ? "ALIGHT" : "TRANSFER";
}

export function smartAlertTitle(type: SmartAlertType): string {
  if (type === "TRANSFER_PREPARE") return "곧 환승해요";
  if (type === "TRANSFER_NOW") return "지금 환승하세요";
  return "곧 내려요";
}

/** 서버 문구에 추천 문이 있으면 "6번째 칸 2번 문"으로 덧붙인다 */
export function smartAlertBody(alert: SmartAlertPayload): string {
  return alert.recommendedDoor ? `${alert.message} · ${describeDoor(alert.recommendedDoor)}` : alert.message;
}

/** 앱이 켜져 있으면 안내 화면의 배너로, 아니면 로컬 알림으로 보여 준다 */
export type SmartAlertDelivery = "BANNER" | "NOTIFICATION";

export function smartAlertDelivery(appState: string): SmartAlertDelivery {
  return appState === "active" ? "BANNER" : "NOTIFICATION";
}
