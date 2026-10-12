import { useAuth } from "@clerk/expo";

/**
 * Clerk useAuth를 래핑한 커스텀 훅
 * 인증 로드 상태, 로그인 여부, 토큰 취득 함수, 유저 ID를 제공합니다.
 */
export function useAuthToken() {
  const { isLoaded, isSignedIn, getToken, userId, signOut } = useAuth();
  return { isLoaded, isSignedIn, getToken, userId, signOut };
}
