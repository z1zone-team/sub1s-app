export interface RankingUserDto {
  rank: number;
  userId: string;
  nickname: string;
  profileImageUrl?: string | null;
  totalDistanceMeters: number;
  score: number;
}

export interface LeaderboardDto {
  scope: "ALL" | "MONTHLY";
  friendsOnly: boolean;
  items: RankingUserDto[];
  myRank?: RankingUserDto;
}
