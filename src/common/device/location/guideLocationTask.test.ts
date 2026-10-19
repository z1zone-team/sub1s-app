import * as Location from "expo-location";
import { Platform } from "react-native";
import {
  GUIDE_LOCATION_TASK,
  newerCoords,
  startGuideLocationService,
  stopGuideLocationService,
  useGuideLocationStore,
} from "./guideLocationTask";
import type { LocationCoords } from "./useForegroundLocation";

jest.mock("expo-location", () => ({
  Accuracy: { Balanced: 3 },
  PermissionStatus: { GRANTED: "granted", DENIED: "denied" },
  hasStartedLocationUpdatesAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  startLocationUpdatesAsync: jest.fn(),
  stopLocationUpdatesAsync: jest.fn(),
}));

const mocked = Location as unknown as {
  hasStartedLocationUpdatesAsync: jest.Mock;
  requestForegroundPermissionsAsync: jest.Mock;
  startLocationUpdatesAsync: jest.Mock;
  stopLocationUpdatesAsync: jest.Mock;
};

const coords = (timestamp: number): LocationCoords => ({
  latitude: 37.5,
  longitude: 127,
  accuracy: 10,
  altitude: null,
  speed: null,
  heading: null,
  timestamp,
});

describe("newerCoords", () => {
  it("더 최근 위치를 고르고, 하나만 있으면 그것을, 둘 다 없으면 null을 돌려준다", () => {
    expect(newerCoords(coords(1), coords(2))?.timestamp).toBe(2);
    expect(newerCoords(coords(5), coords(2))?.timestamp).toBe(5);
    expect(newerCoords(null, coords(2))?.timestamp).toBe(2);
    expect(newerCoords(coords(1), null)?.timestamp).toBe(1);
    expect(newerCoords(null, null)).toBeNull();
  });
});

describe("guide location service", () => {
  const originalOs = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = "android";
    mocked.hasStartedLocationUpdatesAsync.mockResolvedValue(false);
    mocked.requestForegroundPermissionsAsync.mockResolvedValue({ status: "granted" });
    mocked.startLocationUpdatesAsync.mockResolvedValue(undefined);
    mocked.stopLocationUpdatesAsync.mockResolvedValue(undefined);
    useGuideLocationStore.getState().clear();
  });

  afterAll(() => {
    Platform.OS = originalOs;
  });

  it("권한이 있으면 알림이 보이는 포그라운드 서비스로 시작한다", async () => {
    await expect(startGuideLocationService()).resolves.toBe(true);

    const [task, options] = mocked.startLocationUpdatesAsync.mock.calls[0];
    expect(task).toBe(GUIDE_LOCATION_TASK);
    expect(options.foregroundService.notificationTitle).toBeTruthy();
  });

  it("이미 시작했으면 다시 시작하지 않는다", async () => {
    mocked.hasStartedLocationUpdatesAsync.mockResolvedValue(true);

    await expect(startGuideLocationService()).resolves.toBe(true);

    expect(mocked.startLocationUpdatesAsync).not.toHaveBeenCalled();
  });

  it("위치 권한이 없거나 시작하지 못하거나 안드로이드가 아니면 false이고 던지지 않는다", async () => {
    mocked.requestForegroundPermissionsAsync.mockResolvedValue({ status: "denied" });
    await expect(startGuideLocationService()).resolves.toBe(false);

    mocked.requestForegroundPermissionsAsync.mockResolvedValue({ status: "granted" });
    mocked.startLocationUpdatesAsync.mockRejectedValue(new Error("not allowed"));
    await expect(startGuideLocationService()).resolves.toBe(false);

    Platform.OS = "ios";
    mocked.startLocationUpdatesAsync.mockClear();
    await expect(startGuideLocationService()).resolves.toBe(false);
    expect(mocked.startLocationUpdatesAsync).not.toHaveBeenCalled();
  });

  it("멈추면 서비스를 끄고 저장해 둔 위치를 지운다", async () => {
    useGuideLocationStore.getState().set(coords(1));
    mocked.hasStartedLocationUpdatesAsync.mockResolvedValue(true);

    await stopGuideLocationService();

    expect(mocked.stopLocationUpdatesAsync).toHaveBeenCalledWith(GUIDE_LOCATION_TASK);
    expect(useGuideLocationStore.getState().latest).toBeNull();
  });

  it("시작하지 않은 서비스를 멈추려 해도 오류 없이 끝난다", async () => {
    await expect(stopGuideLocationService()).resolves.toBeUndefined();

    expect(mocked.stopLocationUpdatesAsync).not.toHaveBeenCalled();
  });
});
