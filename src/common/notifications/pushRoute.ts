/** EAS 프로젝트 ID는 UUID다. 자리표시나 빈 값이면 푸시 토큰을 얻을 수 없다 */
export function isEasProjectId(value: string | undefined | null): value is string {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export type PushTarget = { screen: "Timeline" } | null;

/** 푸시의 data로 열 화면을 정한다. 월말정산은 타임라인으로 간다. 모르는 알림이면 이동하지 않는다 */
export function pushTargetOf(data: unknown): PushTarget {
  if (!data || typeof data !== "object") return null;
  const { type, screen } = data as { type?: unknown; screen?: unknown };
  if (type === "MONTHLY_SETTLEMENT" || screen === "timeline") return { screen: "Timeline" };
  return null;
}
