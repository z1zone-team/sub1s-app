import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useForegroundLocation } from "@/common/device";
import { getCurrentCoordinates, type CurrentCoordinates } from "@/common/device/location/getCurrentCoordinates";
import { homeMapData } from "./mapData";
import type { MapData } from "./mapHtml";

// 홈을 다시 열어도 위치 감시의 첫 알림을 기다리는 동안 내 위치를 유지한다.
let lastHomeLocation: { coords: CurrentCoordinates; timestamp: number } | null = null;
const LOCATION_MAX_AGE_MS = 2 * 60 * 1000;

/** 홈 지도에 올릴 내 위치와, 지도 검색에서 고른 장소(있으면). 프로토타입 홈 지도에는 그 밖의 핀이 없다 */
export function useHomeMapData(pin?: { lat: number; lng: number }): MapData {
  const location = useForegroundLocation({ autoStart: true });
  const coords = location.coords;
  const [initialLocation, setInitialLocation] = useState(() =>
    lastHomeLocation && Date.now() - lastHomeLocation.timestamp <= LOCATION_MAX_AGE_MS
      ? lastHomeLocation.coords
      : null
  );
  useEffect(() => {
    if (!coords) return;
    lastHomeLocation = {
      coords: { lat: coords.latitude, lng: coords.longitude },
      timestamp: coords.timestamp,
    };
  }, [coords]);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void getCurrentCoordinates().then((current) => {
        if (!active || !current) return;
        setInitialLocation(current);
        lastHomeLocation = { coords: current, timestamp: Date.now() };
      });
      return () => { active = false; };
    }, [])
  );
  const pinLat = pin?.lat;
  const pinLng = pin?.lng;
  return useMemo(
    () =>
      homeMapData({
        me: coords ? { lat: coords.latitude, lng: coords.longitude } : initialLocation ?? undefined,
        pin: pinLat !== undefined && pinLng !== undefined ? { lat: pinLat, lng: pinLng } : undefined,
      }),
    [coords, initialLocation, pinLat, pinLng]
  );
}
