import * as client from "@/apis/client";
import { getTimeline } from "./getTimeline";
import { useTimelineQuery } from "./useTimelineQuery";
import { getTravelStats } from "./getTravelStats";
import { useTravelStatsQuery } from "./useTravelStatsQuery";
import { getLineMap } from "./getLineMap";
import { useLineMapQuery } from "./useLineMapQuery";
import { createTravelLog } from "@/apis/mutations/travel/createTravelLog";
import { useCreateTravelLogMutation } from "@/apis/mutations/travel/useCreateTravelLogMutation";

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockInvalidateQueries = jest.fn();

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: (options: unknown) => mockUseQuery(options),
    useMutation: (options: unknown) => mockUseMutation(options),
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
    }),
  };
});

jest.mock("@/hooks/useAuthToken", () => ({
  useAuthToken: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: "user-1",
  }),
}));

jest.mock("@/apis/client", () => {
  const actual = jest.requireActual("@/apis/client");
  return {
    ...actual,
    get: jest.fn(),
    post: jest.fn(),
  };
});

describe("Travel & Profile Domain APIs & Hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getTimeline and useTimelineQuery should fetch timeline data", async () => {
    const mockTimeline = {
      logs: [
        {
          id: "log-1",
          originStationName: "강남",
          destStationName: "시청",
          distanceKm: 12.5,
          traveledAt: "2026-10-07T10:00:00+09:00",
          lineIds: ["02"],
          isExpress: false,
          durationSec: 1200,
        },
      ],
      totalLogsCount: 1,
      totalDistanceKm: 12.5,
    };
    (client.get as jest.Mock).mockResolvedValue(mockTimeline);

    const query = { year: 2026, month: 10 };
    const result = await getTimeline(query);

    expect(client.get).toHaveBeenCalledWith("/travel/timeline", query, undefined);
    expect(result).toEqual(mockTimeline);

    mockUseQuery.mockReturnValue({ data: mockTimeline, isSuccess: true });
    useTimelineQuery(query);
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["profile", "timeline", 2026, 10, 1, 20],
        enabled: true,
      })
    );
  });

  it("getTravelStats and useTravelStatsQuery should fetch stats", async () => {
    const mockStats = {
      userId: "user-1",
      period: "MONTH" as const,
      totalDistanceKm: 150.8,
      totalTravelCount: 18,
      transferCount: 6,
      totalRideDurationSec: 15400,
      mostVisitedStations: [{ stationId: "0222", stationName: "강남", visitCount: 12 }],
    };
    (client.get as jest.Mock).mockResolvedValue(mockStats);

    const result = await getTravelStats({ period: "MONTH" });
    expect(client.get).toHaveBeenCalledWith("/travel/stats", { period: "MONTH" }, undefined);
    expect(result).toEqual(mockStats);

    mockUseQuery.mockReturnValue({ data: mockStats, isSuccess: true });
    useTravelStatsQuery("MONTH");
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["profile", "stats", "MONTH"],
        enabled: true,
      })
    );
  });

  it("getLineMap and useLineMapQuery should fetch line map", async () => {
    const mockLineMap = {
      userId: "user-1",
      period: "ALL" as const,
      lines: [
        {
          lineId: "2호선",
          lineName: "2호선",
          colorHex: "#00A84D",
          stations: [
            { stationId: "0222", stationName: "강남", lineSeq: 1, lat: 37.4979, lng: 127.0276, visited: true },
          ],
        },
      ],
    };
    (client.get as jest.Mock).mockResolvedValue(mockLineMap);

    const result = await getLineMap({ period: "ALL" });
    expect(client.get).toHaveBeenCalledWith("/travel/line-map", { period: "ALL" }, undefined);
    expect(result).toEqual(mockLineMap);

    mockUseQuery.mockReturnValue({ data: mockLineMap, isSuccess: true });
    useLineMapQuery("ALL");
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["linemap", "period", "ALL"],
        enabled: true,
      })
    );

    // 기간이 바뀌면 다른 캐시를 써야 한다
    useLineMapQuery("WEEK");
    expect(mockUseQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryKey: ["linemap", "period", "WEEK"] })
    );
  });

  it("keeps current month, prior months and years in separate caches and forwards the selected month", async () => {
    const signal = new AbortController().signal;
    useTravelStatsQuery("MONTH", { periodKey: "2025-12" });
    let query = mockUseQuery.mock.calls.at(-1)![0];
    expect(query.queryKey).toEqual(["profile", "stats", "MONTH", "2025-12"]);
    await query.queryFn({ signal });
    expect(client.get).toHaveBeenLastCalledWith("/travel/stats", { period: "MONTH", periodKey: "2025-12" }, { signal });
    useTravelStatsQuery("MONTH", { periodKey: "2026-01" });
    expect(mockUseQuery.mock.calls.at(-1)![0].queryKey).toEqual(["profile", "stats", "MONTH", "2026-01"]);
    useTravelStatsQuery("MONTH");
    expect(mockUseQuery.mock.calls.at(-1)![0].queryKey).toEqual(["profile", "stats", "MONTH"]);

    useLineMapQuery("MONTH", { periodKey: "2025-12" });
    query = mockUseQuery.mock.calls.at(-1)![0];
    expect(query.queryKey).toEqual(["linemap", "period", "MONTH", "2025-12"]);
    await query.queryFn({ signal });
    expect(client.get).toHaveBeenLastCalledWith("/travel/line-map", { period: "MONTH", periodKey: "2025-12" }, { signal });
    useLineMapQuery("MONTH", { periodKey: "2026-01" });
    expect(mockUseQuery.mock.calls.at(-1)![0].queryKey).toEqual(["linemap", "period", "MONTH", "2026-01"]);
    useLineMapQuery("MONTH");
    expect(mockUseQuery.mock.calls.at(-1)![0].queryKey).toEqual(["linemap", "period", "MONTH"]);
  });

  it("createTravelLog standalone function should call post /travel/log", async () => {
    const mockLogResponse = {
      logId: "log-100",
      totalDistanceKm: 14.2,
      transferCount: 1,
      earnedPoints: 150,
      currentTotalPoints: 1400,
    };
    (client.post as jest.Mock).mockResolvedValue(mockLogResponse);

    const res = await createTravelLog({
      originStationId: "0222",
      destStationId: "0234",
    });

    expect(client.post).toHaveBeenCalledWith("/travel/log", {
      originStationId: "0222",
      destStationId: "0234",
    }, undefined);
    expect(res).toEqual(mockLogResponse);
  });

  it("useCreateTravelLogMutation should call post /travel/log and invalidate queries", async () => {
    const mockLogResponse = {
      logId: "log-100",
      totalDistanceKm: 14.2,
      transferCount: 1,
      earnedPoints: 150,
      currentTotalPoints: 1400,
    };
    mockUseMutation.mockReturnValue({ mutateAsync: jest.fn() });

    useCreateTravelLogMutation();

    const passedOptions = mockUseMutation.mock.calls[0][0];
    (client.post as jest.Mock).mockResolvedValue(mockLogResponse);

    const res = await passedOptions.mutationFn({
      originStationId: "0222",
      destStationId: "0234",
    });
    expect(client.post).toHaveBeenCalledWith("/travel/log", {
      originStationId: "0222",
      destStationId: "0234",
    }, undefined);
    expect(res).toEqual(mockLogResponse);

    passedOptions.onSuccess();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["auth"] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["profile"] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["ranking"] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["linemap"] });
  });
});
