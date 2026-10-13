import * as Location from "expo-location";
import { useNetworkStore } from "./network/network-store";
import {
  MAX_RECORDING_DURATION_MS,
  MAX_AUDIO_FILE_SIZE_BYTES,
} from "./audio/useAudioRecorder";

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
