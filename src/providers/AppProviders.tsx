import React, { useEffect, useLayoutEffect, useRef } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { setTokenGetter } from "@/apis/client";
import { ENV } from "@/constants/env";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

/** SecureStore를 활용한 Clerk 토큰 캐시 (앱 재실행 시 세션 유지) */
const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // 스토리지 에러 무시
    }
  },
};

/**
 * React 외부의 client.ts에 Clerk getToken을 주입하고,
 * 유저 변경 시 쿼리 캐시를 초기화하는 브릿지 컴포넌트
 */
function TokenBridge({ children }: { children: React.ReactNode }) {
  const { getToken, userId } = useAuth();
  const client = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useLayoutEffect(() => {
    setTokenGetter(() => getToken());
    return () => {
      setTokenGetter(null);
    };
  }, [getToken]);

  useEffect(() => {
    if (previousUserId.current !== undefined && previousUserId.current !== userId) {
      // 계정 전환/로그아웃 시 이전 계정 캐시 제거
      client.clear();
    }
    previousUserId.current = userId;
  }, [userId, client]);

  return <>{children}</>;
}

export interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SafeAreaProvider>
      <ClerkProvider
        publishableKey={ENV.CLERK_PUBLISHABLE_KEY}
        tokenCache={tokenCache}
      >
        <QueryClientProvider client={queryClient}>
          <TokenBridge>{children}</TokenBridge>
        </QueryClientProvider>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
