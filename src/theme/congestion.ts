import type { Palette } from "./palette";

export type CongestionLevel = "여유" | "보통" | "혼잡";

export function congestionColor(level: CongestionLevel, colors: Palette): string {
  if (level === "여유") return colors.success;
  if (level === "보통") return colors.warning;
  return colors.error;
}

/** 서버 `congestionLevel()`과 같은 기준: 35 미만 여유, 70 이하 보통, 그 위는 혼잡 */
export function levelOfRate(ratePercent: number): CongestionLevel {
  if (ratePercent < 35) return "여유";
  if (ratePercent <= 70) return "보통";
  return "혼잡";
}
