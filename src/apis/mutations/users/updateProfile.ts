import { patch, type RequestOptions } from "@/apis/client";
import type { RankingVisibility } from "@/apis/queries/auth/getMe";

export interface UpdateProfileRequest {
  /** 1~30자. null이면 이름을 지운다 */
  name?: string | null;
  /** 2~20자, 한글, 영문, 숫자, _ . - 만 가능하고 공백은 불가 */
  nickname?: string;
  rankingVisibility?: RankingVisibility;
}

export interface MyProfile {
  userId: string;
  name: string | null;
  nickname: string;
  profileImageUrl: string | null;
  rankingVisibility: RankingVisibility;
}

/**
 * 내 프로필 수정. 보낸 항목만 바뀌고 하나도 없으면 400이다. 닉네임이 겹치면 409 NICKNAME_TAKEN
 * PATCH /api/v1/users/me
 */
export const updateProfile = (
  body: UpdateProfileRequest,
  options?: RequestOptions
): Promise<MyProfile> => {
  return patch<MyProfile>("/users/me", body, options);
};
