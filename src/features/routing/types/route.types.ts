export type RouteMode = "OPTIMAL" | "COMFORTABLE" | "PERSONAL" | "CHEAPEST";

export interface RouteStationDto {
  stationId: string;
  stationName: string;
  line: string;
  order: number;
}

export interface RouteSectionDto {
  line: string;
  fromStation: string;
  toStation: string;
  durationMinutes: number;
  carCongestionAvg?: number;
}

export interface RouteDto {
  routeId: string;
  mode: RouteMode;
  totalDurationMinutes: number;
  totalFareWon: number;
  transferCount: number;
  sections: RouteSectionDto[];
  stations: RouteStationDto[];
}
