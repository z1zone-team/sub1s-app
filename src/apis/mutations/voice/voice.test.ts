import * as client from "@/apis/client";
import { recommendVoiceRoute } from "./recommendVoiceRoute";
import { useVoiceRouteRecommendMutation } from "./useVoiceRouteRecommendMutation";

const mockUseMutation = jest.fn();

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    useMutation: (options: unknown) => mockUseMutation(options),
  };
});

jest.mock("@/apis/client", () => {
  const actual = jest.requireActual("@/apis/client");
  return {
    ...actual,
    postMultipart: jest.fn(),
  };
});

describe("Voice Domain Mutation & Function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockVoiceResponse = {
    transcript: "강남역에서 을지로입구역까지 가줘",
    interpretedIntent: {
      originStationName: "강남",
      destStationName: "을지로입구",
      preferredMode: "OPTIMAL" as const,
      reason: "사용자 음성 요청",
    },
    recommendedRoute: {
      mode: "OPTIMAL" as const,
      totalDurationSec: 1500,
      totalDistanceKm: 18.2,
      totalFare: 1400,
      transferCount: 0,
      estimatedArrivalTimestamp: "2026-10-07T14:45:00Z",
      segments: [],
    },
    briefingText: "강남역에서 2호선을 타시면 환승 없이 25분 만에 도착합니다.",
    audioTtsUrl: "https://example.com/tts/result.mp3",
  };

  const fakeAudio = {
    uri: "file:///data/voice.wav",
    name: "voice.wav",
    type: "audio/wav",
  };

  it("recommendVoiceRoute standalone function should call postMultipart with FormData", async () => {
    (client.postMultipart as jest.Mock).mockResolvedValue(mockVoiceResponse);

    const res = await recommendVoiceRoute({
      audio: fakeAudio,
      preferredMode: "OPTIMAL",
    });

    expect(client.postMultipart).toHaveBeenCalledWith(
      "/voice/route-recommend",
      expect.any(FormData),
      undefined,
      undefined
    );
    expect(res).toEqual(mockVoiceResponse);
  });

  it("useVoiceRouteRecommendMutation should configure mutationFn and delegate to recommendVoiceRoute", async () => {
    mockUseMutation.mockReturnValue({ mutateAsync: jest.fn() });

    useVoiceRouteRecommendMutation();

    const passedOptions = mockUseMutation.mock.calls[0][0];
    (client.postMultipart as jest.Mock).mockResolvedValue(mockVoiceResponse);

    const res = await passedOptions.mutationFn({
      audio: fakeAudio,
      preferredMode: "OPTIMAL",
    });

    expect(client.postMultipart).toHaveBeenCalledWith(
      "/voice/route-recommend",
      expect.any(FormData),
      undefined,
      undefined
    );
    expect(res).toEqual(mockVoiceResponse);
  });
});
