import { useMemo } from "react";
import { useForegroundLocation } from "@/common/device";
import { homeMapData } from "./mapData";
import type { MapData } from "./mapHtml";

/** 홈 지도에 올릴 내 위치와, 지도 검색에서 고른 장소(있으면). 프로토타입 홈 지도에는 그 밖의 핀이 없다 */
export function useHomeMapData(pin?: { lat: number; lng: number }): MapData {
  const location = useForegroundLocation({ autoStart: true });
  const coords = location.coords;
  const pinLat = pin?.lat;
  const pinLng = pin?.lng;
  return useMemo(
    () =>
      homeMapData({
        me: coords ? { lat: coords.latitude, lng: coords.longitude } : undefined,
        pin: pinLat !== undefined && pinLng !== undefined ? { lat: pinLat, lng: pinLng } : undefined,
      }),
    [coords, pinLat, pinLng]
  );
}
