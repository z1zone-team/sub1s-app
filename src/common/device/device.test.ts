import * as Location from "expo-location";
import { useNetworkStore } from "./network/network-store";
import { uploadVoiceRouteRecommend } from "./audio/voice-service";
import {
  MAX_RECORDING_DURATION_MS,
  MAX_AUDIO_FILE_SIZE_BYTES,
} from "./audio/useAudioRecorder";
import { api } from "../../apis/client";

jest.mock("../../apis/client", () => {
  const actual = jest.requireActual("../../apis/client");
  return {
    ...actual,
    api: {
      post: jest.fn(),
    },
  };
});

describe("Device Module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Network Status Store", () => {
    it("should default to online and connected", () => {
      const state = useNetworkStore.getState();
      expect(state.isConnected).toBe(true);
      expect(state.isOffline).toBe(false);
    });

    it("should set isOffline to true when isConnected is false", () => {
      useNetworkStore.getState().actions.setNetworkState({
        isConnected: false,
        isInternetReachable: false,
        connectionType: "none",
      });

      const state = useNetworkStore.getState();
      expect(state.isConnected).toBe(false);
      expect(state.isOffline).toBe(true);
      expect(state.connectionType).toBe("none");
    });

    it("should set isOffline to true when internet is not reachable even if connected", () => {
      useNetworkStore.getState().actions.setNetworkState({
        isConnected: true,
        isInternetReachable: false,
        connectionType: "wifi",
      });

      const state = useNetworkStore.getState();
      expect(state.isOffline).toBe(true);
    });
  });

  describe("Voice Route Recommendation Service", () => {
    it("should throw error if audioUri is empty", async () => {
      await expect(uploadVoiceRouteRecommend("")).rejects.toThrow(
        "Audio URI is required for voice route recommendation."
      );
    });

    it("should post multipart formData and return AI recommendation response", async () => {
      const mockResponseData = {
        transcript: "신도림에서 강남역까지 제일 빠른 경로 알려줘",
        interpretedIntent: {
          originStationName: "신도림",
          destStationName: "강남",
          preferredMode: "OPTIMAL",
          reason: "최단 시간 우선",
        },
        recommendedRoute: {
          totalDurationMinutes: 28,
        },
        briefingText: "2호선 외선순환을 이용하시면 28분 만에 도착합니다.",
        audioTtsUrl: "https://api.sub1s.com/audio/tts/123.mp3",
      };

      (api.post as jest.Mock).mockResolvedValueOnce({
        data: {
          data: mockResponseData,
        },
      });

      const result = await uploadVoiceRouteRecommend(
        "file:///cache/audio/voice_123.m4a",
        { textHint: "강남" }
      );

      expect(api.post).toHaveBeenCalledWith(
        "/voice/route-recommend",
        expect.any(FormData),
        expect.objectContaining({
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
      );
      expect(result).toEqual(mockResponseData);
      expect(result.interpretedIntent.originStationName).toBe("신도림");
    });
  });

  describe("Audio Recorder Constraints", () => {
    it("should enforce 30 seconds max duration and 5MB file size limit", () => {
      expect(MAX_RECORDING_DURATION_MS).toBe(30_000);
      expect(MAX_AUDIO_FILE_SIZE_BYTES).toBe(5 * 1024 * 1024);
    });
  });

  describe("Location Permissions", () => {
    it("should request foreground location permissions", async () => {
      const res = await Location.requestForegroundPermissionsAsync();
      expect(res.status).toBe("granted");
    });
  });
});
