import { del, put } from "@/apis/client";

export type PushPlatform = "ios" | "android";

/**
 * 이 기기의 Expo 푸시 토큰 등록. 같은 토큰이면 갱신하고 다른 계정에 있던 토큰이면 지금 계정으로 옮긴다
 * PUT /api/v1/users/me/push-tokens
 */
export const registerPushToken = (token: string, platform: PushPlatform): Promise<{ registered: boolean }> =>
  put<{ registered: boolean }>("/users/me/push-tokens", { token, provider: "EXPO", platform });

/**
 * 로그아웃할 때 이 기기의 토큰 해제. 응답은 항상 200이다
 * DELETE /api/v1/users/me/push-tokens?token=
 */
export const unregisterPushToken = (token: string): Promise<{ removed: boolean }> =>
  del<{ removed: boolean }>(`/users/me/push-tokens?token=${encodeURIComponent(token)}`);
