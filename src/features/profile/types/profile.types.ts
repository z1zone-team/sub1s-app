export type StatsPeriod = "WEEK" | "MONTH" | "YEAR" | "ALL";

export interface UserStatsDto {
  period: StatsPeriod;
  totalDistanceKm: number;
  totalDurationHours: number;
  transferCount: number;
  visitCount: number;
  carbonSavedKg: number;
  calSavedKcal: number;
}

export interface TimelineLogDto {
  logId: string;
  date: string;
  originStationName: string;
  destStationName: string;
  distanceKm: number;
  durationMinutes: number;
}
