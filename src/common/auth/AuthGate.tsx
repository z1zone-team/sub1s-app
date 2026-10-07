import React, { ReactNode } from "react";
import { useAuthStore } from "./auth-store";

export type AuthGateAccessStatus = "LOADING" | "UNAUTHENTICATED" | "AUTHENTICATED";

/**
 * 인증 로드 상태와 인증 여부를 바탕으로 화면 표시 상태를 판정하는 순수 함수
 */
export function checkAuthGateAccess(
  isLoaded: boolean,
  isAuthenticated: boolean
): AuthGateAccessStatus {
  if (!isLoaded) return "LOADING";
  if (!isAuthenticated) return "UNAUTHENTICATED";
  return "AUTHENTICATED";
}

export interface AuthGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * 디자인 비종속 인증 가드 컴포넌트
 * - LOADING: null (아무것도 렌더링하지 않음)
 * - UNAUTHENTICATED: fallback (비로그인 대체 화면/안내)
 * - AUTHENTICATED: children (보호된 콘텐츠)
 */
export function AuthGate({ children, fallback = null }: AuthGateProps) {
  const { isAuthenticated, isLoaded } = useAuthStore();
  const access = checkAuthGateAccess(isLoaded, isAuthenticated);

  if (access === "LOADING") {
    return null;
  }

  if (access === "UNAUTHENTICATED") {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
