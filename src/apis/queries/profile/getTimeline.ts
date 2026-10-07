import { get, type RequestOptions } from "@/apis/client";

export interface TravelLogItemDto {
  id: string;
  originStationName: string;
  destStationName: string;
  totalDistanceKm: number;
  transferCount: number;
  earnedPoints: number;
  createdAt: string;
}

export interface TimelineResponseDto {
  logs: TravelLogItemDto[];
  totalCount: number;
  totalDistanceKm: number;
}

export interface TimelineQueryDto {
  year?: number;
  month?: number;
  page?: number;
  limit?: number;
}

/**
 * 사용자 이동 기록 타임라인 조회
 * GET /api/v1/travel/timeline
 */
export const getTimeline = (
  query?: TimelineQueryDto,
  options?: RequestOptions
): Promise<TimelineResponseDto> => {
  return get<TimelineResponseDto>("/travel/timeline", query, options);
};
