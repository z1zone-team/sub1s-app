/**
 * TanStack React Query의 쿼리 키 팩토리
 * 키 오타를 방지하고 체계적인 캐시 무효화(invalidateQueries)를 보장합니다.
 */
export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
  },
  places: {
    all: ["places"] as const,
    search: (q: string, lat?: number, lng?: number) =>
      [...queryKeys.places.all, "search", q, lat ?? null, lng ?? null] as const,
  },
  stations: {
    all: ["stations"] as const,
    lookup: (ids: string[]) =>
      [...queryKeys.stations.all, "lookup", ids.join(",")] as const,
    nextTrains: (stationId: string, limit?: number) =>
      [...queryKeys.stations.all, "nextTrains", stationId, limit ?? null] as const,
    facilities: (stationId: string) =>
      [...queryKeys.stations.all, "facilities", stationId] as const,
  },
  routes: {
    all: ["routes"] as const,
    optimal: (origin: string, destination: string, mode?: string) =>
      [...queryKeys.routes.all, "optimal", origin, destination, mode] as const,
    recent: () => [...queryKeys.routes.all, "recent"] as const,
  },
  congestion: {
    all: ["congestion"] as const,
    train: (line: string, trainNo: string) =>
      [...queryKeys.congestion.all, "train", line, trainNo] as const,
  },
  tracking: {
    all: ["tracking"] as const,
    session: (sessionId?: string) =>
      [...queryKeys.tracking.all, "session", sessionId] as const,
  },
  ranking: {
    all: ["ranking"] as const,
    leaderboard: (
      periodType: "ALL" | "MONTHLY" = "MONTHLY",
      periodKey?: string,
      friendsOnly: boolean = false,
      page: number = 1,
      limit: number = 20
    ) =>
      [
        ...queryKeys.ranking.all,
        "leaderboard",
        periodType,
        periodKey ?? "current",
        friendsOnly,
        page,
        limit,
      ] as const,
    myScore: () => [...queryKeys.ranking.all, "myScore"] as const,
  },
  users: {
    all: ["users"] as const,
    preferences: () => [...queryKeys.users.all, "preferences"] as const,
  },
  profile: {
    all: ["profile"] as const,
    stats: (period: "WEEK" | "MONTH" | "YEAR" | "ALL" = "ALL") =>
      [...queryKeys.profile.all, "stats", period] as const,
    timeline: (
      year?: number,
      month?: number,
      page: number = 1,
      limit: number = 20
    ) =>
      [
        ...queryKeys.profile.all,
        "timeline",
        year ?? "all",
        month ?? "all",
        page,
        limit,
      ] as const,
  },
  linemap: {
    all: ["linemap"] as const,
    lines: (lineId?: string, year?: number, month?: number) =>
      [
        ...queryKeys.linemap.all,
        "lines",
        lineId ?? "all",
        year ?? "all",
        month ?? "all",
      ] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    unreadCount: () => [...queryKeys.notifications.all, "unreadCount"] as const,
  },
} as const;
