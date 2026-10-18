import { get, type RequestOptions } from "@/apis/client";
import type { TrainDirection } from "@/apis/queries/stations/getNextTrains";

/** 이 역에 대한 상태. LEFT_PREVIOUS는 바로 앞 역을 출발해 이 역으로 가는 중 */
export type TrainPositionStatus = "ENTERING" | "ARRIVED" | "DEPARTED" | "LEFT_PREVIOUS" | "UNKNOWN";

export interface TrainPosition {
  trainNo: string;
  stationName: string;
  /** 같은 호선에서 이 이름의 역 ID. 찾지 못하면 null */
  stationId: string | null;
  status: TrainPositionStatus;
  direction: TrainDirection;
  destinationName: string;
  isExpress: boolean;
  isLastTrain: boolean;
}

/** OK 정상, NOT_COLLECTED 서버가 아직 모으지 못함, UNSUPPORTED_LINE 서버가 모으지 않는 호선 */
export type TrainPositionsStatus = "OK" | "NOT_COLLECTED" | "UNSUPPORTED_LINE";

export interface LineTrainPositions {
  lineId: string;
  /** REALTIME 서울시 실시간, MOCK 시연용 가짜 열차 */
  source: "REALTIME" | "MOCK";
  status: TrainPositionsStatus;
  /** 서버가 위치를 받은 시각(KST ISO). 실시간이 아니라 이 시각의 위치다 */
  observedAt: string | null;
  /** 받은 지 몇 초가 지났는지 */
  ageSec: number | null;
  /** 서버가 이 호선을 갱신하는 대략의 간격(초) */
  pollIntervalSec: number;
  trains: TrainPosition[];
}

/**
 * 한 호선의 열차 위치(서버가 서울시를 하루 예산 안에서 폴링해 둔 마지막 값)
 * GET /api/v1/trains/positions
 */
export const getTrainPositions = (lineId: string, options?: RequestOptions): Promise<LineTrainPositions> =>
  get<LineTrainPositions>("/trains/positions", { lineId }, options);
