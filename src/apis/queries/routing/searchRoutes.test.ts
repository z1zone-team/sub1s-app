import * as client from "@/apis/client";
import { searchRoutes } from "./searchRoutes";
import { useRouteSearchQuery } from "./useRouteSearchQuery";
import { useRouteSearchMutation } from "@/apis/mutations/routing/useRouteSearchMutation";

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: (options: unknown) => mockUseQuery(options),
    useMutation: (options: unknown) => mockUseMutation(options),
  };
});

jest.mock("@/apis/client", () => {
  const actual = jest.requireActual("@/apis/client");
  return {
    ...actual,
    post: jest.fn(),
  };
});

describe("Routing Domain APIs & Hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSearchResult = {
    options: [
      {
        mode: "OPTIMAL" as const,
        totalDurationSec: 1200,
        totalDistanceKm: 15.2,
        totalFare: 1400,
        transferCount: 1,
        estimatedArrivalTimestamp: "2026-10-07T14:30:00Z",
        segments: [],
      },
    ],
    aiBriefingText: "강남역에서 2호선 탑승 후 교대역 환승을 추천합니다.",
  };

  it("searchRoutes should call post /routes/search with correct payload", async () => {
    (client.post as jest.Mock).mockResolvedValue(mockSearchResult);

    const payload = {
      originStationId: "0222",
      destinationStationId: "0234",
      routeMode: "OPTIMAL" as const,
    };

    const result = await searchRoutes(payload);
    expect(client.post).toHaveBeenCalledWith("/routes/search", payload, undefined);
    expect(result).toEqual(mockSearchResult);
  });

  it("useRouteSearchQuery should configure query options and enable flag correctly", async () => {
    mockUseQuery.mockReturnValue({ data: mockSearchResult, isSuccess: true });

    const query = useRouteSearchQuery({
      originStationId: "0222",
      destinationStationId: "0234",
      routeMode: "OPTIMAL",
    });

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["routes", "optimal", "0222", "0234", "OPTIMAL"],
        enabled: true,
        staleTime: 60_000,
      })
    );
    expect(query.data).toEqual(mockSearchResult);

    // queryFn execution check
    (client.post as jest.Mock).mockResolvedValue(mockSearchResult);
    const passedOptions = mockUseQuery.mock.calls[0][0];
    const res = await passedOptions.queryFn({ signal: undefined });
    expect(client.post).toHaveBeenCalledWith(
      "/routes/search",
      {
        originStationId: "0222",
        destinationStationId: "0234",
        routeMode: "OPTIMAL",
      },
      { signal: undefined }
    );
    expect(res).toEqual(mockSearchResult);
  });

  it("useRouteSearchQuery should disable query when origin or dest is missing", () => {
    useRouteSearchQuery({
      originStationId: "",
      destinationStationId: "0234",
    });

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
  });

  it("useRouteSearchQuery should enable query when coordinates are provided", () => {
    useRouteSearchQuery({
      originLat: 37.498,
      originLng: 127.027,
      destinationLat: 37.566,
      destinationLng: 126.978,
    });

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        queryKey: ["routes", "optimal", "37.498,127.027", "37.566,126.978", undefined],
      })
    );
  });

  it("useRouteSearchMutation should configure mutationFn correctly", async () => {
    mockUseMutation.mockReturnValue({ mutateAsync: jest.fn() });

    useRouteSearchMutation();

    expect(mockUseMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        mutationFn: expect.any(Function),
      })
    );

    const passedOptions = mockUseMutation.mock.calls[0][0];
    (client.post as jest.Mock).mockResolvedValue(mockSearchResult);
    const res = await passedOptions.mutationFn({
      originStationId: "0222",
      destinationStationId: "0234",
    });
    expect(res).toEqual(mockSearchResult);
  });
});
