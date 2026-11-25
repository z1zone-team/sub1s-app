import type { LineMapResponseDto } from "@/apis/queries/profile/getLineMap";

export const MAP_WIDTH = 320;
export const MAP_HEIGHT = 174;
const PADDING = 18;

export function buildRecapMap(data: LineMapResponseDto | undefined) {
  const lines = (data?.lines ?? []).map((line) => ({
    ...line,
    stations: line.stations.filter((station) => station.visited && Number.isFinite(station.lat) && Number.isFinite(station.lng)),
  })).filter((line) => line.stations.length > 0);
  const stations = lines.flatMap((line) => line.stations);
  if (!stations.length) return [];

  const south = Math.min(...stations.map((station) => station.lat));
  const north = Math.max(...stations.map((station) => station.lat));
  const longitudeFactor = Math.cos((south + north) * Math.PI / 360);
  const west = Math.min(...stations.map((station) => station.lng)) * longitudeFactor;
  const east = Math.max(...stations.map((station) => station.lng)) * longitudeFactor;
  const scale = Math.min((MAP_WIDTH - 2 * PADDING) / (east - west), (MAP_HEIGHT - 2 * PADDING) / (north - south));
  const units = Number.isFinite(scale) ? scale : 0;

  return lines.map(({ lineId, lineName, colorHex, stations, links }) => {
    const points = stations.map(({ stationId, lat, lng }) => ({
      id: stationId,
      x: MAP_WIDTH / 2 + (lng * longitudeFactor - (west + east) / 2) * units,
      y: MAP_HEIGHT / 2 - (lat - (south + north) / 2) * units,
    }));
    const byId = new Map(points.map((point) => [point.id, point]));
    const path = (links ?? []).map(({ fromStationId, toStationId }) => {
      const from = byId.get(fromStationId);
      const to = byId.get(toStationId);
      return from && to ? `M${from.x} ${from.y}L${to.x} ${to.y}` : "";
    }).join(" ").trim();
    return { lineId, lineName, colorHex, points, path };
  }).sort((a, b) => b.points.length - a.points.length);
}
