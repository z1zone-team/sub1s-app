import type { TravelLogItemDto } from "@/apis/queries/profile/getTimeline";
import type { StatsBucketDto, TravelStatsPeriod } from "@/apis/queries/profile/getTravelStats";
import { getLineInfo } from "@/theme";
import { weekdayLabel } from "@/features/profile/profileView";

export const PERIODS: Array<{ value: TravelStatsPeriod; label: string }> = [
  { value: "WEEK", label: "주" },
  { value: "MONTH", label: "월" },
  { value: "YEAR", label: "년" },
  { value: "ALL", label: "전체" },
];

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 한국 시간 기준 연, 월. 기기 시간대와 상관없다 */
export function kstYearMonth(nowMs: number): { year: number; month: number } {
  const kst = new Date(nowMs + KST_OFFSET_MS);
  return { year: kst.getUTCFullYear(), month: kst.getUTCMonth() + 1 };
}

/** 막대 key를 기간에 맞는 짧은 라벨로. 주는 요일, 월은 일, 년은 월, 전체는 연 */
export function bucketLabel(period: TravelStatsPeriod, key: string): string {
  if (period === "WEEK") return weekdayLabel(key);
  if (period === "MONTH") return String(Number(key.split("-")[2] ?? ""));
  if (period === "YEAR") return String(Number(key.split("-")[1] ?? ""));
  return key;
}

export interface ChartBar {
  key: string;
  label: string;
  ratio: number;
  distanceKm: number;
}

export function chartBars(period: TravelStatsPeriod, buckets: StatsBucketDto[] | undefined): ChartBar[] {
  if (!buckets) return [];
  const max = Math.max(0, ...buckets.map((bucket) => bucket.distanceKm));
  return buckets.map((bucket) => ({
    key: bucket.key,
    label: bucketLabel(period, bucket.key),
    ratio: max > 0 ? bucket.distanceKm / max : 0,
    distanceKm: bucket.distanceKm,
  }));
}

/** 6:24처럼 시:분. 1분 미만은 0:00 */
export function formatHoursMinutes(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  return `${hours}:${String(totalMinutes % 60).padStart(2, "0")}`;
}

/** 이용 호선 행. 거리가 큰 순서로 오고 가장 긴 호선을 1로 맞춘 비율을 붙인다 */
export function lineRows(
  breakdown: Array<{ lineId: string; distanceKm: number }> | undefined
): Array<{ lineId: string; name: string; color: string; distanceKm: number; ratio: number }> {
  const rows = [...(breakdown ?? [])].sort((a, b) => b.distanceKm - a.distanceKm);
  const max = rows[0]?.distanceKm ?? 0;
  return rows.map((row) => {
    const info = getLineInfo(row.lineId);
    return {
      lineId: row.lineId,
      name: info.name,
      color: info.color,
      distanceKm: row.distanceKm,
      ratio: max > 0 ? row.distanceKm / max : 0,
    };
  });
}

/** "10.06 화" */
export function logDateLabel(traveledAt: string): string {
  const time = Date.parse(traveledAt);
  if (Number.isNaN(time)) return "";
  const kst = new Date(time + KST_OFFSET_MS);
  const month = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kst.getUTCDate()).padStart(2, "0");
  return `${month}.${day} ${["일", "월", "화", "수", "목", "금", "토"][kst.getUTCDay()]}`;
}

/** "9호선 급행 · 24분", 호선이 여러 개면 "9호선 → 3호선" */
export function logSummary(log: TravelLogItemDto): string {
  const lines = log.lineIds.map((id) => getLineInfo(id).name).join(" → ");
  const label = log.isExpress && lines ? `${lines} 급행` : lines;
  const minutes = Math.max(1, Math.round(log.durationSec / 60));
  return [label, `${minutes}분`].filter(Boolean).join(" · ");
}
