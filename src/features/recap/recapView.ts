import type { TravelStatsResponseDto } from "@/apis/queries/profile/getTravelStats";
import { kstYearMonth } from "@/features/timeline/timelineView";
import { getLineInfo } from "@/theme/lines";

export type RecapCard = {
  key: "cover" | "distance" | "rides" | "places" | "peak" | "finish" | "empty";
  title: string;
  value?: string;
  unit?: string;
  detail?: string;
  lineColor?: string;
};

export function previousMonthKey(now: number): string {
  const { year, month } = kstYearMonth(now);
  return `${month === 1 ? year - 1 : year}-${String(month === 1 ? 12 : month - 1).padStart(2, "0")}`;
}

export function recapCards(month: number, stats: TravelStatsResponseDto): RecapCard[] {
  if (!stats.totalTravelCount) {
    return [{ key: "empty", title: `${month}월의 이동 기록이 없어요` }];
  }

  const station = stats.mostVisitedStations[0];
  const line = stats.mostUsedLineId ? getLineInfo(stats.mostUsedLineId) : undefined;
  const minutes = Math.round(stats.totalRideDurationSec / 60);
  const duration = minutes >= 60 ? `${Math.floor(minutes / 60)}시간 ${minutes % 60}분` : `${minutes}분`;
  const distance = stats.totalDistanceKm.toLocaleString("ko-KR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const cards: RecapCard[] = [
    { key: "cover", title: `지하철로 보낸\n나의 ${month}월` },
    { key: "distance", title: "한 달 동안 달린 거리", value: distance, unit: "km" },
    { key: "rides", title: "기록한 이동", value: String(stats.totalTravelCount), unit: "회", detail: `환승 ${stats.transferCount}회 · 탑승 약 ${duration}` },
  ];
  if (station) {
    cards.push({ key: "places", title: "가장 많이 방문한 역", value: station.stationName, detail: `${station.visitCount}회 방문${line ? ` · 가장 많이 이용한 호선 ${line.name}` : ""}`, lineColor: line?.color });
  } else if (line) {
    cards.push({ key: "places", title: "가장 많이 이용한 호선", value: line.name, lineColor: line.color });
  }
  const traveledDays = (stats.buckets ?? []).filter((bucket) => bucket.distanceKm > 0);
  if (traveledDays.length > 1) {
    const peak = traveledDays.reduce((best, day) => day.distanceKm > best.distanceKm ? day : best);
    cards.push({ key: "peak", title: "가장 멀리 이동한 날", value: `${month}월 ${Number(peak.key.slice(-2))}일`, detail: `${peak.distanceKm.toFixed(1)}km 이동` });
  }
  cards.push({ key: "finish", title: "한 달의 이동을\n지도에서 만나요", detail: `${distance}km · 이동 ${stats.totalTravelCount}회` });
  return cards;
}
