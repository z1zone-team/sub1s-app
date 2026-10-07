import { get, type RequestOptions } from "@/apis/client";

export type RankingPeriodType = "MONTHLY" | "ALL";

export interface LeaderboardItemDto {
  rank: number;
  userId: string;
  nickname: string;
  profileImageUrl?: string;
  totalPoints: number;
  totalDistanceKm: number;
}

export interface RankingResponseDto {
  periodType: RankingPeriodType;
  periodKey: string;
  friendsOnly: boolean;
  myRank: number;
  myPoints: number;
  leaderboard: LeaderboardItemDto[];
}

export interface RankingQueryDto {
  periodType?: RankingPeriodType;
  periodKey?: string;
  friendsOnly?: boolean;
  page?: number;
  limit?: number;
}

/**
 * 랭킹 및 리더보드 조회
 * GET /api/v1/ranking
 */
export const getRanking = (
  query?: RankingQueryDto,
  options?: RequestOptions
): Promise<RankingResponseDto> => {
  return get<RankingResponseDto>("/ranking", query, options);
};
