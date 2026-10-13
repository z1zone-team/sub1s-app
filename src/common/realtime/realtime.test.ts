import { useRealtimeStore } from "./realtime-store";
import { subwaySocketClient, setSocketTokenGetter } from "./socket-client";
import { performDeviateCheck } from "./useOfflineFallback";
import { post } from "../../apis/client";
import type { TrainCongestionResponse } from "./types";

// Mock socket.io-client
const mockSocketOn = jest.fn();
const mockSocketOff = jest.fn();
const mockSocketEmit = jest.fn();
const mockSocketConnect = jest.fn();
const mockSocketDisconnect = jest.fn();

const mockSocketInstance = {
  connected: true,
  auth: {},
  on: mockSocketOn,
  off: mockSocketOff,
  emit: mockSocketEmit,
  connect: mockSocketConnect,
  disconnect: mockSocketDisconnect,
};

jest.mock("socket.io-client", () => ({
  io: jest.fn(() => mockSocketInstance),
}));

jest.mock("../../apis/client", () => ({
  post: jest.fn(),
}));

describe("Realtime Module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRealtimeStore.getState().actions.reset();
  });

  describe("Realtime Zustand Store", () => {
    it("should initialize with default disconnected state", () => {
      const state = useRealtimeStore.getState();
      expect(state.isConnected).toBe(false);
      expect(state.currentTrain).toBeNull();
      expect(state.congestion).toBeNull();
      expect(state.cars).toEqual({});
      expect(state.eta).toBeNull();
      expect(state.latestAlert).toBeNull();
    });

    it("should update connection state", () => {
      useRealtimeStore.getState().actions.setConnected(true);
      expect(useRealtimeStore.getState().isConnected).toBe(true);

      useRealtimeStore.getState().actions.setConnected(false);
      expect(useRealtimeStore.getState().isConnected).toBe(false);
    });

    it("should index cars by carNo for selector subscription when congestion is updated", () => {
      const mockCongestion: TrainCongestionResponse = {
        lineId: "2호선",
        trainId: "2145",
        stationId: "0222",
        averageRate: 65,
        source: "STATISTICS",
        updatedAt: "2026-10-07T12:00:00Z",
        cars: [
          {
            carNo: 1,
            rate: 85,
            level: "혼잡",
            isWeakAirConditioned: false,
          },
          {
            carNo: 2,
            rate: 45,
            level: "보통",
            isWeakAirConditioned: true,
          },
        ],
      };

      useRealtimeStore.getState().actions.setCongestion(mockCongestion);

      const state = useRealtimeStore.getState();
      expect(state.congestion).toEqual(mockCongestion);
      expect(state.cars[1]?.rate).toBe(85);
      expect(state.cars[2]?.isWeakAirConditioned).toBe(true);
      expect(state.cars[3]).toBeUndefined();
    });

    it("should update and clear alerts", () => {
      useRealtimeStore.getState().actions.setAlert({
        type: "TRANSFER_PREPARE",
        message: "신도림역 환승 준비",
        recommendedDoor: "4-2",
      });

      expect(useRealtimeStore.getState().latestAlert?.message).toBe("신도림역 환승 준비");

      useRealtimeStore.getState().actions.clearAlert();
      expect(useRealtimeStore.getState().latestAlert).toBeNull();
    });

    it("should update eta tick payload", () => {
      useRealtimeStore.getState().actions.setEta({
        sessionId: "sess_101",
        etaTimestamp: "2026-10-07T12:15:00Z",
        remainingSec: 180,
      });

      expect(useRealtimeStore.getState().eta?.remainingSec).toBe(180);
      expect(useRealtimeStore.getState().eta?.sessionId).toBe("sess_101");
    });
  });

  describe("SubwaySocketClient", () => {
    it("should connect socket and support custom token getter", async () => {
      setSocketTokenGetter(async () => "custom_auth_token_456");

      const socket = await subwaySocketClient.connect();
      expect(socket).toBeDefined();

      subwaySocketClient.joinTrain({ lineId: "02", trainId: "2145" });
      expect(mockSocketEmit).toHaveBeenCalledWith("join_train", {
        lineId: "02",
        trainId: "2145",
      });
      expect(useRealtimeStore.getState().currentTrain).toEqual({
        lineId: "02",
        trainId: "2145",
      });

      subwaySocketClient.reportLocation({
        sessionId: "sess_1",
        currentStationId: "222",
      });
      expect(mockSocketEmit).toHaveBeenCalledWith("report_location", {
        sessionId: "sess_1",
        currentStationId: "222",
      });

      subwaySocketClient.leaveTrain({ lineId: "02", trainId: "2145" });
      expect(mockSocketEmit).toHaveBeenCalledWith("leave_train", {
        lineId: "02",
        trainId: "2145",
      });
      expect(useRealtimeStore.getState().currentTrain).toBeNull();
    });

    it("should handle disconnect", () => {
      subwaySocketClient.disconnect();
      expect(mockSocketDisconnect).toHaveBeenCalled();
      expect(useRealtimeStore.getState().isConnected).toBe(false);
    });

    it("연결을 쓰는 화면이 모두 놓아야 연결을 끊는다", async () => {
      subwaySocketClient.disconnect();
      mockSocketDisconnect.mockClear();

      await subwaySocketClient.retain();
      await subwaySocketClient.retain();

      subwaySocketClient.release();
      expect(mockSocketDisconnect).not.toHaveBeenCalled();

      subwaySocketClient.release();
      expect(mockSocketDisconnect).toHaveBeenCalledTimes(1);
    });

    it("놓는 횟수가 더 많아도 연결 수가 음수가 되지 않는다", async () => {
      subwaySocketClient.release();
      mockSocketDisconnect.mockClear();

      await subwaySocketClient.retain();
      subwaySocketClient.release();

      expect(mockSocketDisconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe("Offline Fallback Logic (REST)", () => {
    it("should request REST endpoint when performDeviateCheck is called and set alert on off-route", async () => {
      (post as jest.Mock).mockResolvedValueOnce({
        sessionId: "sess_100",
        detectedStationId: "222",
        detectedStationName: "강남",
        reason: "WRONG_DIRECTION",
        message: "반대 방향 열차에 탑승하셨습니다.",
      });

      const checkRes = await performDeviateCheck({
        sessionId: "sess_100",
        detectedStationId: "222",
      });

      expect(post).toHaveBeenCalledWith("/routes/track/deviate", {
        sessionId: "sess_100",
        detectedStationId: "222",
      });
      expect(checkRes?.reason).toBe("WRONG_DIRECTION");
      expect(useRealtimeStore.getState().latestAlert?.message).toBe(
        "반대 방향 열차에 탑승하셨습니다."
      );
    });

    it("should gracefully handle REST failure and return null", async () => {
      (post as jest.Mock).mockRejectedValueOnce(new Error("Network Error"));

      const checkRes = await performDeviateCheck({
        sessionId: "sess_100",
        detectedStationId: "222",
      });

      expect(checkRes).toBeNull();
    });
  });
});
