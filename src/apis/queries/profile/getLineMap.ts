import { get, type RequestOptions } from "@/apis/client";
import type { TravelStatsPeriod } from "./getTravelStats";

export interface LineMapStationDto {
  stationId: string;
  stationName: string;
  lineSeq: number;
  lat: number;
  lng: number;
  visited: boolean;
}

export interface LineMapLineDto {
  lineId: string;
  lineName: string;
  colorHex: string;
  stations: LineMapStationDto[];
}

export interface LineMapResponseDto {
  userId: string;
  period: TravelStatsPeriod;
  lines: LineMapLineDto[];
}

export interface LineMapQueryDto {
  period: TravelStatsPeriod;
  userId?: string;
}

/**
 * 호선별 전체 노선망 및 사용자 역 방문 여부 조회
 * GET /api/v1/line-map
 */
export const getLineMap = (
  query: LineMapQueryDto,
  options?: RequestOptions
): Promise<LineMapResponseDto> => {
  return get<LineMapResponseDto>("/line-map", query, options);
};
