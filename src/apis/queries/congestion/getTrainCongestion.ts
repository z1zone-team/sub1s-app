import { get, type RequestOptions } from "@/apis/client";
import type { CongestionLevel } from "../routing/searchRoutes";

export interface CarCongestionDto {
  carNo: number; // 1부터 그 열차의 칸 수까지
  rate: number; // 0 ~ 100
  level: CongestionLevel;
  isWeakAirConditioned: boolean;
}

export interface TrainCongestionResponse {
  lineId: string;
  trainId: string;
  stationId: string;
  averageRate: number;
  cars: CarCongestionDto[];
  updatedAt: string;
}

export interface TrainCongestionQuery {
  lineId: string;
  trainId: string;
  stationId: string;
  direction?: string;
}

/**
 * 특정 열차 칸별 실시간 혼잡도 조회
 * GET /api/v1/congestion/train
 */
export const getTrainCongestion = (
  params: TrainCongestionQuery,
  options?: RequestOptions
): Promise<TrainCongestionResponse> => {
  return get<TrainCongestionResponse>("/congestion/train", params, options);
};
