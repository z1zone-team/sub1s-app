import { useMemo } from "react";
import { useForegroundLocation } from "@/common/device";
import { homeMapData } from "./mapData";
import type { MapData } from "./mapHtml";

/** 홈 지도에 올릴 내 위치. 프로토타입 홈 지도에는 내 위치 말고 다른 핀이 없다 */
export function useHomeMapData(): MapData {
  const location = useForegroundLocation({ autoStart: true });
  const coords = location.coords;
  return useMemo(
    () => homeMapData({ me: coords ? { lat: coords.latitude, lng: coords.longitude } : undefined }),
    [coords]
  );
}
