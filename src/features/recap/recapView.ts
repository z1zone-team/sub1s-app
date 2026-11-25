import type { MostVisitedStationDto, TravelStatsResponseDto } from "@/apis/queries/profile/getTravelStats";
import { kstYearMonth } from "@/features/timeline/timelineView";
import { getLineInfo } from "@/theme/lines";

export type RecapCard = {
  key: "cover" | "distance" | "rides" | "places" | "territory" | "peak" | "finish" | "empty";
  title: string;
  value?: string;
  unit?: string;
  detail?: string;
  lineColor?: string;
  metric?: { amount: number; digits: number };
  stations?: MostVisitedStationDto[];
};

export function formatRecapMetric(amount: number, digits: number): string {
  return amount.toLocaleString("ko-KR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function previousMonthKey(now: number): string {
  const { year, month } = kstYearMonth(now);
  return `${month === 1 ? year - 1 : year}-${String(month === 1 ? 12 : month - 1).padStart(2, "0")}`;
}

export function recapCards(month: number, stats: TravelStatsResponseDto): RecapCard[] {
  if (!stats.totalTravelCount) {
    return [{ key: "empty", title: `${month}월의 이동 기록이 없어요` }];
  }

  const stations = stats.mostVisitedStations.slice(0, 3);
  const line = stats.mostUsedLineId ? getLineInfo(stats.mostUsedLineId) : undefined;
  const minutes = Math.round(stats.totalRideDurationSec / 60);
  const duration = minutes >= 60 ? `${Math.floor(minutes / 60)}시간 ${minutes % 60}분` : `${minutes}분`;
  const distance = formatRecapMetric(stats.totalDistanceKm, 1);
  const cards: RecapCard[] = [
    { key: "cover", title: `지하철로 보낸\n나의 ${month}월` },
    { key: "distance", title: "한 달 동안 달린 거리", metric: { amount: stats.totalDistanceKm, digits: 1 }, unit: "km" },
    { key: "rides", title: "기록한 이동", metric: { amount: stats.totalTravelCount, digits: 0 }, unit: "회", detail: `환승 ${stats.transferCount}회 · 탑승 약 ${duration}` },
  ];
  if (stations.length > 0) {
    cards.push({ key: "places", title: "자주 방문한 역", stations, detail: "출발·도착 기록 기준", lineColor: line?.color });
  } else if (line) {
    cards.push({ key: "places", title: "가장 많이 이용한 호선", value: line.name, lineColor: line.color });
  }
  cards.push({ key: "territory", title: "지하철로 움직인 범위" });
  const traveledDays = (stats.buckets ?? []).filter((bucket) => bucket.distanceKm > 0);
  if (traveledDays.length > 1) {
    const peak = traveledDays.reduce((best, day) => day.distanceKm > best.distanceKm ? day : best);
    cards.push({ key: "peak", title: "가장 멀리 이동한 날", value: `${month}월 ${Number(peak.key.slice(-2))}일`, detail: `${peak.distanceKm.toFixed(1)}km 이동` });
  }
  cards.push({ key: "finish", title: "한 달의 이동을\n지도에서 만나요", detail: `${distance}km · 이동 ${stats.totalTravelCount}회` });
  return cards;
}
