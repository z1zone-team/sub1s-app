import { get, type RequestOptions } from "@/apis/client";

export interface Preferences {
  purposes: string[];
  routePrefs: string[];
}

/**
 * 온보딩 설문 답 조회. 설문 전이면 두 배열이 모두 빈 값이다
 * GET /api/v1/users/me/preferences
 */
export const getPreferences = (options?: RequestOptions): Promise<Preferences> => {
  return get<Preferences>("/users/me/preferences", undefined, options);
};
