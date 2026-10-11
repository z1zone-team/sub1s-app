import type { LeaderboardItemDto, RankingResponseDto } from "@/apis/queries/ranking/getRanking";

export type RankingScope = "MONTHLY" | "ALL";

export const SCOPES: Array<{ value: RankingScope; label: string }> = [
  { value: "MONTHLY", label: "월간" },
  { value: "ALL", label: "전체" },
];

/** 월간은 한국 시간 기준 연월(2026-10), 전체는 ALL */
export function periodKeyOf(scope: RankingScope, year: number, month: number): string {
  return scope === "ALL" ? "ALL" : `${year}-${String(month).padStart(2, "0")}`;
}

/** "10월 · 전체 이용자 2,481명", 친구만이면 "10월 · 친구 6명", 전체 기간이면 "누적" */
export function captionText(
  scope: RankingScope,
  month: number,
  friendsOnly: boolean,
  totalUsers: number | undefined
): string {
  const period = scope === "ALL" ? "누적" : `${month}월`;
  if (totalUsers === undefined) return period;
  const who = friendsOnly ? `친구 ${totalUsers.toLocaleString("en-US")}명` : `전체 이용자 ${totalUsers.toLocaleString("en-US")}명`;
  return `${period} · ${who}`;
}

export interface MoodLevel {
  key: "NORMAL" | "TIRED" | "DARK_CIRCLES";
  label: string;
  range: string;
  face: string;
}

export const MOOD_LEVELS: MoodLevel[] = [
  { key: "NORMAL", label: "보통", range: "~50km", face: "🙂" },
  { key: "TIRED", label: "피곤", range: "50~150km", face: "😩" },
  { key: "DARK_CIRCLES", label: "다크서클", range: "150km~", face: "😵" },
];

/** 이번 달 이동 거리로 정하는 표정. 50km 미만 보통, 150km 미만 피곤, 그 이상 다크서클 */
export function moodOf(monthlyKm: number): MoodLevel {
  if (monthlyKm >= 150) return MOOD_LEVELS[2];
  if (monthlyKm >= 50) return MOOD_LEVELS[1];
  return MOOD_LEVELS[0];
}

export interface RankingRow {
  kind: "ROW";
  rank: number;
  nickname: string;
  isMe: boolean;
  /** 내 항목이 목록 밖일 때는 거리를 몰라 점수로 보여 준다 */
  value: string;
}

export interface GapRow {
  kind: "GAP";
}

export const displayName = (item: Pick<LeaderboardItemDto, "nickname" | "isAnonymous">): string =>
  item.isAnonymous ? "익명" : item.nickname;

const kmText = (km: number): string => km.toFixed(1) + "km";

/**
 * 4위부터의 목록. 내 순위가 받아온 목록에 없으면 "···" 뒤에 내 순위와 점수를 붙인다
 */
export function rowsAfterPodium(data: RankingResponseDto | undefined): Array<RankingRow | GapRow> {
  if (!data) return [];
  const rest: Array<RankingRow | GapRow> = data.leaderboard
    .filter((item) => item.rank > 3)
    .map((item) => ({
      kind: "ROW",
      rank: item.rank,
      nickname: displayName(item),
      isMe: !!item.isMe,
      value: kmText(item.totalDistanceKm),
    }));

  const meListed = data.leaderboard.some((item) => item.isMe);
  if (!meListed && data.myRank > 0) {
    rest.push({ kind: "GAP" });
    rest.push({
      kind: "ROW",
      rank: data.myRank,
      nickname: "나",
      isMe: true,
      value: `${data.myPoints.toLocaleString("en-US")}점`,
    });
  }
  return rest;
}

export function podium(data: RankingResponseDto | undefined): Array<{ rank: number; name: string; km: string; isMe: boolean }> {
  return (data?.leaderboard ?? [])
    .filter((item) => item.rank <= 3)
    .map((item) => ({
      rank: item.rank,
      name: displayName(item),
      km: kmText(item.totalDistanceKm),
      isMe: !!item.isMe,
    }));
}
