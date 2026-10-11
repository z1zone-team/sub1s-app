import { useMemo } from "react";
import { useStationsQuery } from "@/apis/queries/stations/useStationsQuery";
import { useForegroundLocation } from "@/common/device";
import type { RecentDestination } from "@/features/routing/recentDestinations";
import { homeMapData } from "./mapData";
import type { MapData } from "./mapHtml";

/** 홈 지도에 올릴 내 위치와 최근 도착지. 역은 좌표를 서버에서 받아 온다 */
export function useHomeMapData(destinations: RecentDestination[]): MapData {
  const location = useForegroundLocation({ autoStart: true });
  const stationIds = destinations
    .filter((destination) => destination.endpoint.lat === undefined && destination.endpoint.stationId)
    .map((destination) => destination.endpoint.stationId as string);
  const stations = useStationsQuery(stationIds);

  const coords = location.coords;
  return useMemo(() => {
    const recents: Array<{ name: string; lat: number; lng: number }> = [];
    for (const destination of destinations) {
      const { endpoint } = destination;
      if (endpoint.lat !== undefined && endpoint.lng !== undefined) {
        recents.push({ name: endpoint.name, lat: endpoint.lat, lng: endpoint.lng });
        continue;
      }
      const station = stations.data?.items.find((item) => item.stationId === endpoint.stationId);
      if (station) recents.push({ name: station.name, lat: station.lat, lng: station.lng });
    }
    return homeMapData({
      me: coords ? { lat: coords.latitude, lng: coords.longitude } : undefined,
      recents,
    });
  }, [destinations, stations.data, coords]);
}
