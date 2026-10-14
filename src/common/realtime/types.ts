import type { VoiceRouteRecommendResponseDto } from "../../apis/mutations/voice/voiceRouteTypes";
import type {
  TrainCongestionResponse,
  CarCongestionDto,
} from "../../apis/queries/congestion/getTrainCongestion";

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

/** 랭킹이 바뀌었다는 익명 신호. 누가 바뀌었는지는 없고 다시 불러오라는 뜻이다 */
export interface RankingChangedPayload {
  periodType: "MONTHLY" | "ALL";
  periodKey: string;
}

/** 내 점수가 바뀌었을 때 나에게만 오는 신호 */
export interface RankingUpdatePayload {
  periodKey: string;
  currentPoints: number;
}

/** 음성 작업이 성공했을 때 요청한 본인에게만 오는 신호 */
export interface VoiceResultPayload {
  jobId: string;
  result: VoiceRouteRecommendResponseDto;
}

/** 음성 작업이 실패했을 때 요청한 본인에게만 오는 신호 (HTTP 오류 응답과 같은 코드와 메시지) */
export interface VoiceFailedPayload {
  jobId: string;
  error: { code: string; message: string; status: number };
}

export interface ClientToServerEvents {
  join_train: (payload: JoinTrainPayload) => void;
  leave_train: (payload: LeaveTrainPayload) => void;
  report_location: (payload: ReportLocationPayload) => void;
}

export interface ServerToClientEvents {
  congestion_tick: (data: TrainCongestionResponse) => void;
  eta_tick: (data: EtaTickPayload) => void;
  smart_alert: (data: SmartAlertPayload) => void;
  offroute_alert: (data: OffRouteAlertPayload) => void;
  ranking_changed: (data: RankingChangedPayload) => void;
  ranking_update: (data: RankingUpdatePayload) => void;
  voice_result: (data: VoiceResultPayload) => void;
  voice_failed: (data: VoiceFailedPayload) => void;
}

export type { TrainCongestionResponse, CarCongestionDto };
