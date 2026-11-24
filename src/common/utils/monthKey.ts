/** 서버 월 조회 범위와 같은 YYYY-MM(2000~2100년). 외부 푸시 데이터도 검증한다. */
export function parseMonthKey(value: unknown): { year: number; month: number } | undefined {
  if (typeof value !== "string") return undefined;
  const match = /^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.exec(value);
  return match ? { year: Number(match[1]), month: Number(match[2]) } : undefined;
}
