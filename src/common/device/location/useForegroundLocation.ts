import { useState, useEffect, useCallback, useRef } from "react";
import * as Location from "expo-location";

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

/** 이 시간 안에 첫 위치가 오지 않으면 대체 안내를 보여 준다 */
export const LOCATION_FIX_TIMEOUT_MS = 5000;

export interface UseForegroundLocationOptions {
  accuracy?: Location.Accuracy;
  distanceInterval?: number; // 미터 단위 (기본 10m)
  timeInterval?: number; // 밀리초 단위 (기본 5000ms)
  autoStart?: boolean;
  /** 있으면 시작할 때 이 나이 안의 마지막 위치를 먼저 쓰고, 정확한 위치가 오면 바꾼다 */
  lastKnownMaxAgeMs?: number;
  /** 있으면 권한을 받은 뒤 이 시간 안에 첫 위치가 없을 때 fixTimedOut이 true가 된다 */
  fixTimeoutMs?: number;
}

function toLocationCoords(loc: Location.LocationObject): LocationCoords {
  return {
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    accuracy: loc.coords.accuracy,
    altitude: loc.coords.altitude,
    speed: loc.coords.speed,
    heading: loc.coords.heading,
    timestamp: loc.timestamp,
  };
}

export function useForegroundLocation(options?: UseForegroundLocationOptions) {
  const [coords, setCoords] = useState<LocationCoords | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fixTimedOut, setFixTimedOut] = useState<boolean>(false);

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const stopWatching = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    setIsWatching(false);
  }, []);

  const startWatching = useCallback(async () => {
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== Location.PermissionStatus.GRANTED) {
        setError("LOCATION_PERMISSION_DENIED");
        setIsWatching(false);
        return;
      }

      // 기존 구독 제거 후 새로 시작
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }

      if (options?.lastKnownMaxAgeMs) {
        void Location.getLastKnownPositionAsync({ maxAge: options.lastKnownMaxAgeMs })
          .then((last) => {
            if (last) setCoords((current) => current ?? toLocationCoords(last));
          })
          .catch(() => undefined);
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: options?.accuracy ?? Location.Accuracy.Balanced,
          distanceInterval: options?.distanceInterval ?? 10,
          timeInterval: options?.timeInterval ?? 5000,
        },
        (loc) => {
          setCoords(toLocationCoords(loc));
        }
      );

      subscriptionRef.current = subscription;
      setIsWatching(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to watch location";
      setError(msg);
      setIsWatching(false);
    }
  }, [options?.accuracy, options?.distanceInterval, options?.timeInterval, options?.lastKnownMaxAgeMs]);

  useEffect(() => {
    if (options?.autoStart) {
      void startWatching();
    }

    return () => {
      stopWatching();
    };
  }, [options?.autoStart, startWatching, stopWatching]);

  const fixTimeoutMs = options?.fixTimeoutMs;
  const hasCoords = coords !== null;
  const permissionGranted = permissionStatus === Location.PermissionStatus.GRANTED;
  useEffect(() => {
    if (!fixTimeoutMs || hasCoords || !permissionGranted) {
      setFixTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setFixTimedOut(true), fixTimeoutMs);
    return () => clearTimeout(timer);
  }, [fixTimeoutMs, hasCoords, permissionGranted]);

  return {
    coords,
    fixTimedOut,
    permissionStatus,
    isWatching,
    error,
    startWatching,
    stopWatching,
  };
}
