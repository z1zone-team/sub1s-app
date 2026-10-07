import { get } from "@/apis/client";

export interface Me {
  id: string;
  clerkId: string;
  email: string;
  nickname: string;
  profileImageUrl?: string | null;
  totalDistanceMeters: number;
  currentStreakDays: number;
  rankScore: number;
  createdAt: string;
}

/**
 * 현재 로그인된 사용자 정보 조회
 * 백엔드 DB가 유저 권한 및 점수의 단일 출처(Source of Truth)입니다.
 */
export const getMe = (): Promise<Me> => {
  return get<Me>("/auth/me");
};
