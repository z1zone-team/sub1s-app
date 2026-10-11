import { get, type RequestOptions } from "@/apis/client";

export interface TravelLogItemDto {
  id: string;
  originStationName: string;
  destStationName: string;
  distanceKm: number;
  /** ISO-8601, 한국 시간(+09:00) */
  traveledAt: string;
  /** 이용한 호선 순서대로(도보 제외) */
  lineIds: string[];
  /** 급행 구간을 포함하는지 */
  isExpress: boolean;
  /** 탑승 시간(초). 경로 기록을 읽지 못하면 거리 기반 추정이다 */
  durationSec: number;
}

export interface TimelineResponseDto {
  totalDistanceKm: number;
  totalLogsCount: number;
  logs: TravelLogItemDto[];
}

export interface TimelineQueryDto {
  year: number;
  month: number;
}

/**
 * 월간 이동 기록 타임라인 조회(최신순)
 * GET /api/v1/travel/timeline
 */
export const getTimeline = (
  query: TimelineQueryDto,
  options?: RequestOptions
): Promise<TimelineResponseDto> => {
  return get<TimelineResponseDto>("/travel/timeline", query, options);
};
