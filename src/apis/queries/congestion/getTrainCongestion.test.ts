import * as client from "@/apis/client";
import { getTrainCongestion, type TrainCongestionResponse } from "./getTrainCongestion";
import { useTrainCongestionQuery } from "./useTrainCongestionQuery";

const mockUseQuery = jest.fn();

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: (options: unknown) => mockUseQuery(options),
  };
});

jest.mock("@/apis/client", () => {
  const actual = jest.requireActual("@/apis/client");
  return {
    ...actual,
    get: jest.fn(),
  };
});

describe("Congestion Domain APIs & Hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCongestionData: TrainCongestionResponse = {
    lineId: "2호선",
    trainId: "2145",
    stationId: "0222",
    averageRate: 48,
    source: "STATISTICS",
    cars: [
      { carNo: 1, rate: 32, level: "여유" as const, isWeakAirConditioned: false },
      { carNo: 2, rate: 58, level: "보통" as const, isWeakAirConditioned: true },
      { carNo: 3, rate: 74, level: "혼잡" as const, isWeakAirConditioned: false },
    ],
    updatedAt: "2026-10-07T14:30:00Z",
  };

  it("getTrainCongestion should call get /congestion/train with query params", async () => {
    (client.get as jest.Mock).mockResolvedValue(mockCongestionData);

    const query = {
      lineId: "2호선",
      trainId: "2145",
      stationId: "0222",
    };

    const result = await getTrainCongestion(query);
    expect(client.get).toHaveBeenCalledWith("/congestion/train", query, undefined);
    expect(result).toEqual(mockCongestionData);
  });

  it("useTrainCongestionQuery should configure query options and fetcher", async () => {
    mockUseQuery.mockReturnValue({ data: mockCongestionData, isSuccess: true });

    const query = useTrainCongestionQuery({
      lineId: "2호선",
      trainId: "2145",
      stationId: "0222",
    });

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["congestion", "train", "2호선", "2145"],
        enabled: true,
        staleTime: 15_000,
        refetchInterval: 30_000,
      })
    );
    expect(query.data).toEqual(mockCongestionData);

    (client.get as jest.Mock).mockResolvedValue(mockCongestionData);
    const passedOptions = mockUseQuery.mock.calls[0][0];
    const res = await passedOptions.queryFn({ signal: undefined });
    expect(client.get).toHaveBeenCalledWith(
      "/congestion/train",
      { lineId: "2호선", trainId: "2145", stationId: "0222" },
      { signal: undefined }
    );
    expect(res).toEqual(mockCongestionData);
  });

  it("useTrainCongestionQuery should be disabled when lineId is empty", () => {
    useTrainCongestionQuery({
      lineId: "",
      trainId: "2145",
      stationId: "0222",
    });

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
  });
});
