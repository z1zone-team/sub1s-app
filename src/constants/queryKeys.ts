/**
 * TanStack React Query의 쿼리 키 팩토리
 * 키 오타를 방지하고 체계적인 캐시 무효화(invalidateQueries)를 보장합니다.
 */
export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
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
    leaderboard: (scope: "ALL" | "MONTHLY", friendsOnly: boolean) =>
      [...queryKeys.ranking.all, "leaderboard", scope, friendsOnly] as const,
    myScore: () => [...queryKeys.ranking.all, "myScore"] as const,
  },
  profile: {
    all: ["profile"] as const,
    stats: (period: "WEEK" | "MONTH" | "YEAR" | "ALL") =>
      [...queryKeys.profile.all, "stats", period] as const,
    timeline: () => [...queryKeys.profile.all, "timeline"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    unreadCount: () => [...queryKeys.notifications.all, "unreadCount"] as const,
  },
} as const;
