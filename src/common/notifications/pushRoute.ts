import { parseMonthKey } from "@/common/utils/monthKey";

/** EAS 프로젝트 ID는 UUID다. 자리표시나 빈 값이면 푸시 토큰을 얻을 수 없다 */
export function isEasProjectId(value: string | undefined | null): value is string {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export type PushTarget =
  | { screen: "MonthlyRecap"; periodKey: string }
  | { screen: "Timeline"; periodKey?: string }
  | null;

/** 날짜를 확인한 월말정산은 정산 카드를 열고 기존 타임라인 알림도 지원한다 */
export function pushTargetOf(data: unknown): PushTarget {
  if (!data || typeof data !== "object") return null;
  const { type, screen, periodKey } = data as { type?: unknown; screen?: unknown; periodKey?: unknown };
  const month = typeof periodKey === "string" && parseMonthKey(periodKey) ? periodKey : undefined;
  if (type === "MONTHLY_SETTLEMENT" && month) return { screen: "MonthlyRecap", periodKey: month };
  if (type === "MONTHLY_SETTLEMENT" || screen === "timeline") return { screen: "Timeline", ...(month ? { periodKey: month } : {}) };
  return null;
}
