import { useState, useCallback, useEffect } from "react";
import { post } from "../../apis/client";
import { useRealtimeStore } from "./realtime-store";
import type { OffRouteAlertPayload } from "./types";

export interface DeviateCheckRequestDto {
  sessionId: string;
  detectedStationId: string;
}

export interface OffRouteAlertDto {
  sessionId: string;
  detectedStationId: string;
  detectedStationName: string;
  reason: "WRONG_DIRECTION" | "SKIPPED_TRANSFER";
  message: string;
  rerouteOption?: unknown;
}

export interface OfflineFallbackOptions {
  sessionId?: string;
  detectedStationId?: string;
  enabled?: boolean;
  pollIntervalMs?: number;
}

/**
 * REST API를 통한 오탑승 긴급 검사 단독 함수
 */
export async function performDeviateCheck(
  payload: DeviateCheckRequestDto
): Promise<OffRouteAlertDto | null> {
  try {
    const result = await post<OffRouteAlertDto>(
      "/routes/track/deviate",
      payload
    );

    if (result && result.reason) {
      const alertPayload: OffRouteAlertPayload = {
        sessionId: result.sessionId,
        currentStationId: result.detectedStationId,
        isDeviated: true,
        message: result.message,
      };
      useRealtimeStore.getState().actions.setAlert(alertPayload);
    }

    return result;
  } catch (error) {
    console.warn("[useOfflineFallback] REST fallback deviate check failed:", error);
    return null;
  }
}

/**
 * 소켓 단절 시 REST (POST /api/v1/routes/track/deviate)로 오탑승 감지를 처리하는 폴백 훅
 */
export function useOfflineFallback(options?: OfflineFallbackOptions) {
  const isConnected = useRealtimeStore((state) => state.isConnected);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [lastCheckResult, setLastCheckResult] = useState<OffRouteAlertDto | null>(null);

  const checkDeviateViaRest = useCallback(
    async (payload: DeviateCheckRequestDto): Promise<OffRouteAlertDto | null> => {
      setIsChecking(true);
      try {
        const result = await performDeviateCheck(payload);
        setLastCheckResult(result);
        return result;
      } finally {
        setIsChecking(false);
      }
    },
    []
  );

  // 소켓 연결이 끊겼고 자동 폴링 옵션이 켜져 있을 때 주기적 REST 폴백 실행
  useEffect(() => {
    if (isConnected || !options?.enabled || !options?.sessionId || !options?.detectedStationId) {
      return;
    }

    const interval = options.pollIntervalMs ?? 15000;
    const timer = setInterval(() => {
      void checkDeviateViaRest({
        sessionId: options.sessionId!,
        detectedStationId: options.detectedStationId!,
      });
    }, interval);

    return () => clearInterval(timer);
  }, [
    isConnected,
    options?.enabled,
    options?.sessionId,
    options?.detectedStationId,
    options?.pollIntervalMs,
    checkDeviateViaRest,
  ]);

  return {
    isFallbackActive: !isConnected,
    isChecking,
    lastCheckResult,
    checkDeviateViaRest,
  };
}
