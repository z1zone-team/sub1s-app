import type {
  TrainCongestionDto,
  CarCongestionDto,
} from "../../features/congestion";

export interface EtaTickPayload {
  sessionId: string;
  etaTimestamp: string;
  remainingSec: number;
}

export type SmartAlertType = "TRANSFER_PREPARE" | "TRANSFER_NOW" | "ALIGHT_PREPARE";

export interface SmartAlertPayload {
  type: SmartAlertType;
  message: string;
  recommendedDoor: string;
  audioUrl?: string;
}

export interface OffRouteAlertPayload {
  sessionId: string;
  currentStationId: string;
  isDeviated: boolean;
  alternateRouteId?: string;
  message: string;
}

export interface JoinTrainPayload {
  lineId: string;
  trainId: string;
}

export interface LeaveTrainPayload {
  lineId: string;
  trainId: string;
}

export interface ReportLocationPayload {
  sessionId: string;
  currentStationId: string;
}

export interface ClientToServerEvents {
  join_train: (payload: JoinTrainPayload) => void;
  leave_train: (payload: LeaveTrainPayload) => void;
  report_location: (payload: ReportLocationPayload) => void;
}

export interface ServerToClientEvents {
  congestion_tick: (data: TrainCongestionDto) => void;
  eta_tick: (data: EtaTickPayload) => void;
  smart_alert: (data: SmartAlertPayload) => void;
  offroute_alert: (data: OffRouteAlertPayload) => void;
}

export type { TrainCongestionDto, CarCongestionDto };
