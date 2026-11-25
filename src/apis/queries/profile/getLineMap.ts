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

/** 이어서 지난 같은 호선의 두 역. 지선이 있는 호선도 실제 지난 순서로 잇는 데 쓴다 */
export interface LineMapLinkDto {
  fromStationId: string;
  toStationId: string;
}

export interface LineMapLineDto {
  lineId: string;
  lineName: string;
  colorHex: string;
  stations: LineMapStationDto[];
  /** 서버가 아직 안 주는 버전이면 없다. 없으면 호선 번호 순서로 잇는다 */
  links?: LineMapLinkDto[];
}

export interface LineMapResponseDto {
  userId: string;
  period: TravelStatsPeriod;
  lines: LineMapLineDto[];
}

export interface LineMapQueryDto {
  period: TravelStatsPeriod;
  userId?: string;
  /** MONTH에서만 지정. 생략하면 이번 달 */
  periodKey?: string;
}

/**
 * 호선별 전체 노선망 및 사용자 역 방문 여부 조회
 * GET /api/v1/travel/line-map
 */
export const getLineMap = (
  query: LineMapQueryDto,
  options?: RequestOptions
): Promise<LineMapResponseDto> => {
  return get<LineMapResponseDto>("/travel/line-map", query, options);
};
