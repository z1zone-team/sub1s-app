import type { RankingVisibility } from "@/apis/queries/auth/getMe";
import type { StatsBucketDto } from "@/apis/queries/profile/getTravelStats";

export const VISIBILITY_OPTIONS: Array<{ value: RankingVisibility; label: string; description: string }> = [
  { value: "PUBLIC", label: "공개", description: "친구에게 이동 거리와 랭킹이 보여요" },
  { value: "ANONYMOUS", label: "익명", description: "랭킹에 순위와 점수만 보이고 닉네임은 익명이에요" },
  { value: "PRIVATE", label: "비공개", description: "나만 볼 수 있어요 · 랭킹에서 숨김" },
];

const NICKNAME_PATTERN = /^[0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ_.-]+$/;

/** 서버 규칙(2~20자, 한글/영문/숫자/_/./-, 공백 불가)과 같은 검사. 통과하면 빈 문구 */
export function nicknameError(nickname: string): string {
  const value = nickname.trim();
  if (value.length < 2 || value.length > 20) return "닉네임은 2~20자로 입력해 주세요";
  if (!NICKNAME_PATTERN.test(value)) return "한글, 영문, 숫자, _ . - 만 쓸 수 있고 공백은 안 돼요";
  return "";
}

export function nameError(name: string): string {
  return name.trim().length > 30 ? "이름은 30자까지 입력할 수 있어요" : "";
}

/** 상위 N% 문구. 값이 없으면 보여 주지 않는다 */
export function percentileText(percentile: number | undefined): string {
  if (percentile === undefined || !Number.isFinite(percentile)) return "";
  return `지하철 이용 상위 ${Math.round(percentile)}%`;
}

export interface WeekBar {
  key: string;
  label: string;
  /** 0~1, 가장 많이 이동한 날이 1 */
  ratio: number;
  distanceKm: number;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 막대 key(KST 날짜)의 요일. 기기 시간대와 상관없이 날짜 문자열로 계산한다 */
export function weekdayLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return "";
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

export function weekBars(buckets: StatsBucketDto[] | undefined): WeekBar[] {
  if (!buckets) return [];
  const max = Math.max(0, ...buckets.map((bucket) => bucket.distanceKm));
  return buckets.map((bucket) => ({
    key: bucket.key,
    label: weekdayLabel(bucket.key),
    ratio: max > 0 ? bucket.distanceKm / max : 0,
    distanceKm: bucket.distanceKm,
  }));
}

export function sumDistanceKm(buckets: StatsBucketDto[] | undefined): number {
  return (buckets ?? []).reduce((sum, bucket) => sum + bucket.distanceKm, 0);
}
