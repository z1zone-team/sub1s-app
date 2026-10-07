import { AuthUser, useAuthStore } from "./auth-store";
import { setTokenGetter } from "@/apis/client";

export const MOCK_DEVELOPER_USER: AuthUser = {
  id: "usr_mock_dev_01",
  clerkId: "clerk_dev_01",
  email: "developer@sub1s.com",
  nickname: "지하철개발자",
  totalDistanceMeters: 42195,
  currentStreakDays: 14,
  rankScore: 2500,
};

export const MOCK_JWT_TOKEN = "mock.jwt.token.sub1s.developer";

/**
 * 로컬 개발 또는 오프라인 환경용 Mock 인증 활성화
 */
export const enableMockAuth = (user: AuthUser = MOCK_DEVELOPER_USER): void => {
  useAuthStore.getState().enableMockMode(user);
  setTokenGetter(async () => MOCK_JWT_TOKEN);
};

export const disableMockAuth = (): void => {
  useAuthStore.getState().disableMockMode();
  setTokenGetter(null);
};
