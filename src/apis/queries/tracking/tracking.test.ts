import * as client from "@/apis/client";
import { getTrackingSession } from "./getTrackingSession";
import { useTrackingSessionQuery } from "./useTrackingSessionQuery";
import { startTracking } from "@/apis/mutations/tracking/startTracking";
import { useStartTrackingMutation } from "@/apis/mutations/tracking/useStartTrackingMutation";
import { checkDeviate } from "@/apis/mutations/tracking/deviateCheck";
import { useDeviateCheckMutation } from "@/apis/mutations/tracking/useDeviateCheckMutation";
import { reportLocation } from "@/apis/mutations/tracking/reportLocation";
import { useReportLocationMutation } from "@/apis/mutations/tracking/useReportLocationMutation";

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockSetQueryData = jest.fn();

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: (options: unknown) => mockUseQuery(options),
    useMutation: (options: unknown) => mockUseMutation(options),
    useQueryClient: () => ({
      setQueryData: mockSetQueryData,
      invalidateQueries: jest.fn(),
    }),
  };
});

jest.mock("@/apis/client", () => {
  const actual = jest.requireActual("@/apis/client");
  return {
    ...actual,
    get: jest.fn(),
    post: jest.fn(),
  };
});

describe("Tracking Domain APIs & Hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockOption = { segments: [{ lineId: "02" }] } as never;
  const startBody = { routeOption: mockOption };
  const mockSession = {
    sessionId: "sess-12345",
    currentStationId: "0222",
    currentStationName: "강남",
    nextStationId: "0223",
    nextStationName: "역삼",
    destStationId: "0230",
    destStationName: "잠실",
    remainingDurationSec: 900,
    isOffRoute: false,
    expectedRemainingStationIds: ["0223", "0230"],
  };

  it("getTrackingSession should call get /routes/track/:sessionId", async () => {
    (client.get as jest.Mock).mockResolvedValue(mockSession);

    const result = await getTrackingSession("sess-12345");
    expect(client.get).toHaveBeenCalledWith("/routes/track/sess-12345", undefined, undefined);
    expect(result).toEqual(mockSession);
  });

  it("useTrackingSessionQuery should configure query options", async () => {
    mockUseQuery.mockReturnValue({ data: mockSession, isSuccess: true });

    const query = useTrackingSessionQuery("sess-12345");

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["tracking", "session", "sess-12345"],
        enabled: true,
        staleTime: 5_000,
      })
    );
    expect(query.data).toEqual(mockSession);

    (client.get as jest.Mock).mockResolvedValue(mockSession);
    const passedOptions = mockUseQuery.mock.calls[0][0];
    const res = await passedOptions.queryFn({ signal: undefined });
    expect(client.get).toHaveBeenCalledWith(
      "/routes/track/sess-12345",
      undefined,
      { signal: undefined }
    );
    expect(res).toEqual(mockSession);
  });

  it("startTracking standalone function should call post /routes/track/start", async () => {
    (client.post as jest.Mock).mockResolvedValue(mockSession);

    const res = await startTracking(startBody);

    expect(client.post).toHaveBeenCalledWith("/routes/track/start", startBody, undefined);
    expect(res).toEqual(mockSession);
  });

  it("useStartTrackingMutation should delegate to startTracking and update cache on success", async () => {
    mockUseMutation.mockReturnValue({ mutateAsync: jest.fn() });

    useStartTrackingMutation();

    const passedOptions = mockUseMutation.mock.calls[0][0];
    (client.post as jest.Mock).mockResolvedValue(mockSession);

    const res = await passedOptions.mutationFn(startBody);
    expect(client.post).toHaveBeenCalledWith("/routes/track/start", startBody, undefined);
    expect(res).toEqual(mockSession);

    passedOptions.onSuccess(mockSession);
    expect(mockSetQueryData).toHaveBeenCalledWith(
      ["tracking", "session", "sess-12345"],
      mockSession
    );
  });

  it("checkDeviate standalone function should call post /routes/track/deviate", async () => {
    const mockAlert = {
      isOffRoute: true,
      sessionId: "sess-12345",
      detectedStationId: "0250",
      reason: "반대 방향 탑승 감지",
    };
    (client.post as jest.Mock).mockResolvedValue(mockAlert);

    const res = await checkDeviate({
      sessionId: "sess-12345",
      detectedStationId: "0250",
    });

    expect(client.post).toHaveBeenCalledWith("/routes/track/deviate", {
      sessionId: "sess-12345",
      detectedStationId: "0250",
      isUserConfirmed: undefined,
    }, undefined);
    expect(res).toEqual(mockAlert);
  });

  it("useDeviateCheckMutation should delegate to checkDeviate", async () => {
    const mockAlert = {
      isOffRoute: true,
      sessionId: "sess-12345",
      detectedStationId: "0250",
      reason: "반대 방향 탑승 감지",
    };
    mockUseMutation.mockReturnValue({ mutateAsync: jest.fn() });

    useDeviateCheckMutation();

    const passedOptions = mockUseMutation.mock.calls[0][0];
    (client.post as jest.Mock).mockResolvedValue(mockAlert);

    const res = await passedOptions.mutationFn({
      sessionId: "sess-12345",
      detectedStationId: "0250",
    });

    expect(client.post).toHaveBeenCalledWith("/routes/track/deviate", {
      sessionId: "sess-12345",
      detectedStationId: "0250",
      isUserConfirmed: undefined,
    }, undefined);
    expect(res).toEqual(mockAlert);
  });

  it("reportLocation standalone function should call post /routes/track/location", async () => {
    (client.post as jest.Mock).mockResolvedValue(mockSession);

    const res = await reportLocation({
      sessionId: "sess-12345",
      currentStationId: "0223",
    });

    expect(client.post).toHaveBeenCalledWith("/routes/track/location", {
      sessionId: "sess-12345",
      currentStationId: "0223",
    }, undefined);
    expect(res).toEqual(mockSession);
  });

  it("useReportLocationMutation should delegate to reportLocation and update cache", async () => {
    mockUseMutation.mockReturnValue({ mutateAsync: jest.fn() });

    useReportLocationMutation();

    const passedOptions = mockUseMutation.mock.calls[0][0];
    (client.post as jest.Mock).mockResolvedValue(mockSession);

    const res = await passedOptions.mutationFn({
      sessionId: "sess-12345",
      currentStationId: "0223",
    });

    expect(client.post).toHaveBeenCalledWith("/routes/track/location", {
      sessionId: "sess-12345",
      currentStationId: "0223",
    }, undefined);
    expect(res).toEqual(mockSession);

    passedOptions.onSuccess(mockSession);
    expect(mockSetQueryData).toHaveBeenCalledWith(
      ["tracking", "session", "sess-12345"],
      mockSession
    );
  });
});
