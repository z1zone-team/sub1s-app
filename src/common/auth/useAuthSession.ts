import { useCallback, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useAuthStore, type AuthUser } from "./auth-store";
import { post } from "@/apis/client";

export interface AuthSyncBody {
  clerkId: string;
  email: string;
  nickname: string;
  profileImageUrl?: string;
}

/**
 * Clerk 인증 상태를 구독하고 백엔드 DB와 세션을 동기화하는 훅
 */
export function useAuthSession() {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const { user, isAuthenticated, setAuth, clearAuth, setLoaded, isMockMode } =
    useAuthStore();

  const syncWithBackend = useCallback(async () => {
    if (isMockMode) return;
    if (!isSignedIn || !clerkUser) return;

    try {
      const token = await getToken();
      if (!token) return;

      const synced = await post<AuthUser>("/auth/sync", {
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
        nickname:
          clerkUser.fullName ??
          clerkUser.username ??
          clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0] ??
          "SubwayRider",
        profileImageUrl: clerkUser.imageUrl,
      });

      setAuth(synced, token);
    } catch (err) {
      console.error("[useAuthSession] Failed to sync session with backend:", err);
    }
  }, [isSignedIn, clerkUser, getToken, setAuth, isMockMode]);

  useEffect(() => {
    if (isMockMode) return;

    setLoaded(isLoaded);

    if (isLoaded && isSignedIn && clerkUser) {
      void syncWithBackend();
    } else if (isLoaded && !isSignedIn) {
      clearAuth();
    }
  }, [isLoaded, isSignedIn, clerkUser, isMockMode, setLoaded, clearAuth, syncWithBackend]);

  const logout = useCallback(async () => {
    if (isMockMode) {
      useAuthStore.getState().disableMockMode();
      return;
    }
    await signOut();
    clearAuth();
  }, [signOut, clearAuth, isMockMode]);

  return {
    user,
    isAuthenticated,
    isLoaded,
    syncWithBackend,
    logout,
  };
}
