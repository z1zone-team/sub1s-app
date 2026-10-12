import type { RankingResponseDto } from "@/apis/queries/ranking/getRanking";
import {
  captionText,
  kstYearMonth,
  moodOf,
  periodKeyOf,
  kmNumber,
  podium,
  rowsAfterPodium,
} from "./rankingView";

const item = (rank: number, over: Record<string, unknown> = {}) => ({
  rank,
  userId: "u" + rank,
  nickname: "닉" + rank,
  totalPoints: 100,
  totalDistanceKm: 10 * rank,
  isMe: false,
  isAnonymous: false,
  ...over,
});

const data = (leaderboard: ReturnType<typeof item>[], over: Partial<RankingResponseDto> = {}): RankingResponseDto => ({
  periodType: "MONTHLY",
  periodKey: "2026-10",
  friendsOnly: false,
  myRank: 0,
  myPoints: 0,
  leaderboard,
  ...over,
});

describe("kstYearMonth", () => {
  it("한국 시간 기준 연월을 돌려준다", () => {
    expect(kstYearMonth(Date.parse("2026-09-30T16:00:00Z"))).toEqual({ year: 2026, month: 10 });
    expect(kstYearMonth(Date.parse("2026-09-30T14:59:00Z"))).toEqual({ year: 2026, month: 9 });
  });
});

describe("periodKeyOf", () => {
  it("월간은 연월, 전체는 ALL이다", () => {
    expect(periodKeyOf("MONTHLY", 2026, 9)).toBe("2026-09");
    expect(periodKeyOf("ALL", 2026, 9)).toBe("ALL");
  });
});

describe("captionText", () => {
  it("월간 전체 이용자", () => {
    expect(captionText("MONTHLY", 10, false, 2481)).toBe("10월 · 전체 이용자 2,481명");
  });

  it("친구만 보기와 누적", () => {
    expect(captionText("ALL", 10, true, 6)).toBe("누적 · 친구 6명");
  });

  it("인원을 모르면 기간만 보여 준다", () => {
    expect(captionText("MONTHLY", 10, false, undefined)).toBe("10월");
  });
});

describe("moodOf", () => {
  it("거리에 따라 표정이 바뀐다", () => {
    expect(moodOf(0).key).toBe("NORMAL");
    expect(moodOf(49.9).key).toBe("NORMAL");
    expect(moodOf(50).key).toBe("TIRED");
    expect(moodOf(149.9).key).toBe("TIRED");
    expect(moodOf(150).key).toBe("DARK_CIRCLES");
  });
});

describe("kmNumber", () => {
  it("소수 첫째 자리와 천 단위 쉼표", () => {
    expect(kmNumber(312.84)).toBe("312.8");
    expect(kmNumber(1204.6)).toBe("1,204.6");
    expect(kmNumber(0)).toBe("0.0");
  });
});

describe("podium와 목록", () => {
  const all = [item(1), item(2), item(3), item(4), item(5, { isAnonymous: true })];

  it("1~3위만 시상대에 올린다", () => {
    expect(podium(data(all)).map((entry) => entry.rank)).toEqual([1, 2, 3]);
  });

  it("4위부터 목록에 두고 익명은 익명으로 보여 준다", () => {
    const rows = rowsAfterPodium(data(all));
    expect(rows).toEqual([
      { kind: "ROW", rank: 4, nickname: "@닉4", isMe: false, value: "40.0km" },
      { kind: "ROW", rank: 5, nickname: "익명", isMe: false, value: "50.0km" },
    ]);
  });

  it("내가 목록 밖이면 구분선 뒤에 내 순위와 점수를 붙인다", () => {
    const rows = rowsAfterPodium(data(all, { myRank: 298, myPoints: 963 }));
    expect(rows.slice(-2)).toEqual([
      { kind: "GAP" },
      { kind: "ROW", rank: 298, nickname: "나", isMe: true, value: "963점" },
    ]);
  });

  it("내가 목록 안에 있으면 따로 붙이지 않는다", () => {
    const rows = rowsAfterPodium(data([item(1), item(4, { isMe: true })], { myRank: 4, myPoints: 1 }));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ isMe: true });
  });

  it("점수가 없어 순위가 0이면 붙이지 않고 데이터가 없으면 빈 목록이다", () => {
    expect(rowsAfterPodium(data([item(1)], { myRank: 0 }))).toEqual([]);
    expect(rowsAfterPodium(undefined)).toEqual([]);
  });
});
