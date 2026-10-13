import * as Location from "expo-location";
import { CURRENT_POSITION_TIMEOUT_MS, getCurrentCoordinates } from "./getCurrentCoordinates";

jest.mock("expo-location", () => ({
  PermissionStatus: { GRANTED: "granted", DENIED: "denied", UNDETERMINED: "undetermined" },
  Accuracy: { Balanced: 3 },
  getForegroundPermissionsAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

const permission = Location.getForegroundPermissionsAsync as jest.Mock;
const lastKnown = Location.getLastKnownPositionAsync as jest.Mock;
const current = Location.getCurrentPositionAsync as jest.Mock;

const position = (latitude: number, longitude: number) => ({ coords: { latitude, longitude } });

describe("getCurrentCoordinates", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    permission.mockResolvedValue({ status: "granted" });
  });

  it("마지막 위치가 있으면 그 위치를 바로 쓴다", async () => {
    lastKnown.mockResolvedValue(position(37.5, 126.9));

    await expect(getCurrentCoordinates()).resolves.toEqual({ lat: 37.5, lng: 126.9 });
    expect(current).not.toHaveBeenCalled();
  });

  it("마지막 위치가 없으면 현재 위치를 한 번 읽는다", async () => {
    lastKnown.mockResolvedValue(null);
    current.mockResolvedValue(position(37.4, 127.1));

    await expect(getCurrentCoordinates()).resolves.toEqual({ lat: 37.4, lng: 127.1 });
  });

  it("권한이 없으면 묻지 않고 null이다", async () => {
    permission.mockResolvedValue({ status: "denied" });

    await expect(getCurrentCoordinates()).resolves.toBeNull();
    expect(lastKnown).not.toHaveBeenCalled();
    expect(current).not.toHaveBeenCalled();
  });

  it("위치를 읽는 데 시간이 너무 걸리면 null이다", async () => {
    jest.useFakeTimers();
    try {
      lastKnown.mockResolvedValue(null);
      current.mockReturnValue(new Promise(() => undefined));

      const result = getCurrentCoordinates();
      await jest.advanceTimersByTimeAsync(CURRENT_POSITION_TIMEOUT_MS + 1);

      await expect(result).resolves.toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it("위치를 읽다가 오류가 나면 null이다", async () => {
    lastKnown.mockResolvedValue(null);
    current.mockRejectedValue(new Error("location unavailable"));

    await expect(getCurrentCoordinates()).resolves.toBeNull();
  });

  it("권한 조회가 실패해도 던지지 않고 null이다", async () => {
    permission.mockRejectedValue(new Error("no permission module"));

    await expect(getCurrentCoordinates()).resolves.toBeNull();
  });

  it("숫자가 아닌 좌표는 버린다", async () => {
    lastKnown.mockResolvedValue(position(Number.NaN, 126.9));
    current.mockResolvedValue(position(Number.NaN, 126.9));

    await expect(getCurrentCoordinates()).resolves.toBeNull();
  });
});
