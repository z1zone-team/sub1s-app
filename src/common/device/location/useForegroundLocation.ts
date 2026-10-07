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

export interface UseForegroundLocationOptions {
  accuracy?: Location.Accuracy;
  distanceInterval?: number; // 미터 단위 (기본 10m)
  timeInterval?: number; // 밀리초 단위 (기본 5000ms)
  autoStart?: boolean;
}

export function useForegroundLocation(options?: UseForegroundLocationOptions) {
  const [coords, setCoords] = useState<LocationCoords | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: options?.accuracy ?? Location.Accuracy.Balanced,
          distanceInterval: options?.distanceInterval ?? 10,
          timeInterval: options?.timeInterval ?? 5000,
        },
        (loc) => {
          setCoords({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy,
            altitude: loc.coords.altitude,
            speed: loc.coords.speed,
            heading: loc.coords.heading,
            timestamp: loc.timestamp,
          });
        }
      );

      subscriptionRef.current = subscription;
      setIsWatching(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to watch location";
      setError(msg);
      setIsWatching(false);
    }
  }, [options?.accuracy, options?.distanceInterval, options?.timeInterval]);

  useEffect(() => {
    if (options?.autoStart) {
      void startWatching();
    }

    return () => {
      stopWatching();
    };
  }, [options?.autoStart, startWatching, stopWatching]);

  return {
    coords,
    permissionStatus,
    isWatching,
    error,
    startWatching,
    stopWatching,
  };
}
