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

/** 기간 선택 아래에 보이는 이름: 이번 주, 9월, 2026년, 전체 기간 */
export function periodName(period: TravelStatsPeriod, nowMs: number): string {
  const { year, month } = kstYearMonth(nowMs);
  if (period === "WEEK") return "이번 주";
  if (period === "MONTH") return `${month}월`;
  if (period === "YEAR") return `${year}년`;
  return "전체 기간";
}

const AXIS_STEPS = [1, 2, 4, 5, 10];
const round1 = (value: number): number => Math.round(value * 10) / 10;

/**
 * 막대 그래프의 세로 눈금 4개(위에서 아래로 [최대, 2/3, 1/3, 0]).
 * 최대 거리를 담는 가장 작은 "간격 x 3"을 고른다. 간격은 1, 2, 4, 5, 10에 10의 거듭제곱을 곱한 값이다
 * (프로토타입: 11.5km는 12, 8, 4, 0 / 25.5km는 30, 20, 10, 0 / 96.3km는 120, 80, 40, 0)
 */
export function axisTicks(maxKm: number): { max: number; ticks: number[] } {
  if (!Number.isFinite(maxKm) || maxKm <= 0) return { max: 3, ticks: [3, 2, 1, 0] };
  let scale = 0.1;
  for (;;) {
    for (const base of AXIS_STEPS) {
      const step = round1(base * scale);
      if (step * 3 >= maxKm) return { max: round1(step * 3), ticks: [round1(step * 3), round1(step * 2), step, 0] };
    }
    scale *= 10;
  }
}

/** ISO 시각의 한국 날짜 "2026-10-12". 읽을 수 없으면 빈 문자열 */
export function kstDateKey(iso: string): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return "";
  return new Date(time + KST_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * 이동 지도의 이동 목록. 주와 월은 막대 날짜 범위 안의 기록만 남긴다.
 * 년과 전체는 기록 API가 월 단위라 받아 온 기록을 그대로 둔다(이번 달 기록뿐)
 */
export function logsForPeriod(
  logs: TravelLogItemDto[],
  period: TravelStatsPeriod,
  buckets: StatsBucketDto[] | undefined
): TravelLogItemDto[] {
  if ((period !== "WEEK" && period !== "MONTH") || !buckets || buckets.length === 0) return logs;
  const start = buckets[0].key;
  const end = buckets[buckets.length - 1].key;
  return logs.filter((log) => {
    const key = kstDateKey(log.traveledAt);
    return key >= start && key <= end;
  });
}

/** 호선을 골랐을 때 그 호선을 탄 기록만 또렷하게 보인다. 고르지 않았으면 모두 또렷하다 */
export function logMatchesLine(log: TravelLogItemDto, focusLineId: string | undefined): boolean {
  return !focusLineId || log.lineIds.includes(focusLineId);
}
