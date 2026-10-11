import { get, type RequestOptions } from "@/apis/client";

export type TrainDirection = "UP" | "DOWN" | "INNER" | "OUTER";

export interface NextTrain {
  direction: TrainDirection;
  /** 행선지(종착역) 이름 */
  headsign: string;
  /** 응답 시점 기준 남은 초. 모르면 null */
  arrivalInSec: number | null;
  /** 시각표 기반이면 "08:00 출발 예정" */
  message: string;
  isExpress: boolean;
  currentLocation?: string;
}

/**
 * OK 정상(열차가 없으면 빈 배열), UNSUPPORTED_LINE 이 노선 정보 없음,
 * UNAVAILABLE 일시적으로 가져오지 못함(주말에 휴일 시각표가 없는 2·7호선 등)
 */
export type NextTrainsStatus = "OK" | "UNSUPPORTED_LINE" | "UNAVAILABLE";

export interface NextTrainsResult {
  stationId: string;
  stationName: string;
  lineId: string;
  source: "REALTIME" | "TIMETABLE";
  status: NextTrainsStatus;
  /** 정보를 가져온 시각 (KST ISO) */
  updatedAt: string;
  trains: NextTrain[];
}

export interface NextTrainsParams {
  stationId: string;
  /** 방향별 열차 수, 1~5 (서버 기본 2) */
  limit?: number;
}

/**
 * 역의 다음 열차 정보 (행선지와 남은 시간)
 * GET /api/v1/stations/:stationId/next-trains
 */
export const getNextTrains = (
  { stationId, limit }: NextTrainsParams,
  options?: RequestOptions
): Promise<NextTrainsResult> => {
  return get<NextTrainsResult>(
    `/stations/${encodeURIComponent(stationId)}/next-trains`,
    limit === undefined ? undefined : { limit },
    options
  );
};
