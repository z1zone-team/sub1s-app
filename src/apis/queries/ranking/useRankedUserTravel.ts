import { useQuery } from "@tanstack/react-query";
import { ApiError, get, type RequestOptions } from "@/apis/client";
import type { LineMapResponseDto } from "@/apis/queries/profile/getLineMap";
import type { TimelineQueryDto, TimelineResponseDto } from "@/apis/queries/profile/getTimeline";
import type { TravelStatsResponseDto } from "@/apis/queries/profile/getTravelStats";
import { queryKeys } from "@/constants/queryKeys";
import { useAuthToken } from "@/hooks/useAuthToken";

export type RankedTravelPeriod = "MONTH" | "ALL";

export async function getRankedUserTravel(userId: string, period: RankedTravelPeriod, month: TimelineQueryDto, options: RequestOptions) {
  const path = `/users/${encodeURIComponent(userId)}/travel`;
  const [stats, map, timeline] = await Promise.all([
    get<TravelStatsResponseDto>(`${path}/stats`, { period }, options),
    get<LineMapResponseDto>(`${path}/line-map`, { period }, options),
    period === "MONTH" ? get<TimelineResponseDto & { userId: string }>(`${path}/timeline`, month, options) : undefined,
  ]);
  return { stats, map, timeline };
}

export function useRankedUserTravel(targetId: string, period: RankedTravelPeriod, month: TimelineQueryDto) {
  const { isSignedIn, userId } = useAuthToken();
  return useQuery({
    queryKey: queryKeys.ranking.userTravel(userId ?? undefined, targetId, period, `${month.year}-${month.month}`),
    queryFn: ({ signal }) => getRankedUserTravel(targetId, period, month, { signal }),
    enabled: Boolean(isSignedIn && userId && targetId),
    // 열 때마다 서버의 최신 공개 범위를 확인하고, 화면을 닫으면 응답을 보관하지 않는다.
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: "always",
    retry: (count, error) => count < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
  });
}
