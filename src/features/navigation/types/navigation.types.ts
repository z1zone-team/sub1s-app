export type NavigationStatus = "IN_TRANSIT" | "TRANSFERRED" | "ARRIVED" | "DEVIATED";

export interface NavigationSessionDto {
  sessionId: string;
  routeId: string;
  currentStationId: string;
  currentStationName: string;
  nextStationId: string;
  nextStationName: string;
  remainingMinutes: number;
  isDeviated: boolean;
  status: NavigationStatus;
  updatedAt: string;
}
