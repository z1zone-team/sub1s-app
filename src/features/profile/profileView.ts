import type { RankingVisibility } from "@/apis/queries/auth/getMe";
import type { StatsBucketDto } from "@/apis/queries/profile/getTravelStats";

export const VISIBILITY_OPTIONS: Array<{ value: RankingVisibility; label: string; description: string }> = [
  { value: "PUBLIC", label: "공개", description: "모두에게 이동 거리와 랭킹이 보여요" },
  { value: "ANONYMOUS", label: "익명", description: "친구가 아닌 사람에게는 닉네임이 익명으로 보여요 · 친구에게는 항상 보여요" },
  { value: "PRIVATE", label: "비공개", description: "친구가 아닌 사람에게는 랭킹에서 숨겨요 · 친구에게는 항상 보여요" },
];

/** MY의 공개 스위치는 공개(켜짐)와 비공개(꺼짐) 둘뿐이다. 익명은 설정 화면에서 고르고 스위치에는 켜짐으로 보인다 */
export function isVisibilityOn(visibility: RankingVisibility): boolean {
  return visibility !== "PRIVATE";
}

/** 스위치를 누르면 켜짐은 비공개로, 꺼짐은 공개로 바뀐다 */
export function toggledVisibility(visibility: RankingVisibility): RankingVisibility {
  return isVisibilityOn(visibility) ? "PRIVATE" : "PUBLIC";
}

export function visibilityDescription(visibility: RankingVisibility): string {
  return VISIBILITY_OPTIONS.find((option) => option.value === visibility)?.description ?? "";
}

/**
 * MY 프로필 카드 윗줄에 보일 이름. 서버에 저장한 이름 -> 로그인한 계정 이름 -> 닉네임 순서로 쓴다.
 * 로그인 동기화는 닉네임만 보내서 서버 이름은 프로필 수정에서 넣기 전까지 비어 있다
 */
export function profileDisplayName(
  savedName: string | null | undefined,
  accountName: string | null | undefined,
  nickname: string | undefined
): string {
  return savedName?.trim() || accountName?.trim() || nickname || "";
}

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

/** 이번 달 상위 N% 문구(월간 랭킹의 내 백분위). 값이 없으면 보여 주지 않는다 */
export function percentileText(percentile: number | undefined): string {
  if (percentile === undefined || !Number.isFinite(percentile)) return "";
  return `이번 달 상위 ${Math.round(percentile)}%`;
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
