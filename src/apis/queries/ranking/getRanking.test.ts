import * as client from "@/apis/client";
import { getRanking } from "./getRanking";
import { useRankingQuery } from "./useRankingQuery";

const mockUseQuery = jest.fn();

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: (options: unknown) => mockUseQuery(options),
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
  };
});

describe("Ranking Domain APIs & Hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRankingData = {
    periodType: "MONTHLY" as const,
    periodKey: "2026-10",
    friendsOnly: false,
    myRank: 3,
    myPoints: 1250,
    leaderboard: [
      {
        rank: 1,
        userId: "user-top",
        nickname: "지하철왕",
        totalPoints: 3400,
        totalDistanceKm: 280.5,
      },
      {
        rank: 2,
        userId: "user-runnerup",
        nickname: "쾌속통근러",
        totalPoints: 2100,
        totalDistanceKm: 190.2,
      },
      {
        rank: 3,
        userId: "user-1",
        nickname: "테스트유저",
        totalPoints: 1250,
        totalDistanceKm: 120.4,
      },
    ],
  };

  it("getRanking should call get /ranking with query params", async () => {
    (client.get as jest.Mock).mockResolvedValue(mockRankingData);

    const query = {
      periodType: "MONTHLY" as const,
      periodKey: "2026-10",
      friendsOnly: false,
      page: 1,
      limit: 20,
    };

    const result = await getRanking(query);
    expect(client.get).toHaveBeenCalledWith("/ranking", query, undefined);
    expect(result).toEqual(mockRankingData);
  });

  it("useRankingQuery should configure query options and enable flag", async () => {
    mockUseQuery.mockReturnValue({ data: mockRankingData, isSuccess: true });

    useRankingQuery({
      periodType: "MONTHLY",
      periodKey: "2026-10",
    });

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["ranking", "leaderboard", "MONTHLY", "2026-10", false, 1, 20],
        enabled: true,
        staleTime: 60_000,
      })
    );
  });
});
