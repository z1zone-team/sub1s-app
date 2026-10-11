import { put, type RequestOptions } from "@/apis/client";
import type { Preferences } from "@/apis/queries/users/getPreferences";

/**
 * 온보딩 설문 답 저장. 두 배열을 통째로 바꾸므로 둘 다 1개 이상 보내야 한다
 * PUT /api/v1/users/me/preferences
 */
export const updatePreferences = (
  body: Preferences,
  options?: RequestOptions
): Promise<Preferences> => {
  return put<Preferences>("/users/me/preferences", body, options);
};
