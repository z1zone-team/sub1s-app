import type { OffRouteAlert, TrackingSession } from "@/apis/queries/tracking/getTrackingSession";
import { delayText, isOffRouteAlert, shouldShowAlert } from "./offRoute";

const session = {
  sessionId: "s",
  currentStationId: "a",
  currentStationName: "가",
  nextStationId: "b",
  nextStationName: "나",
  destStationId: "c",
  destStationName: "다",
  remainingDurationSec: 600,
  isOffRoute: false,
  expectedRemainingStationIds: ["b", "c"],
} as TrackingSession;

const alert = {
  sessionId: "s",
  detectedStationId: "x",
  detectedStationName: "엑스",
  reason: "WRONG_DIRECTION",
  message: "경로를 이탈했습니다.",
  rerouteOption: { segments: [] },
  isOffRoute: true,
} as unknown as OffRouteAlert;

describe("isOffRouteAlert", () => {
  it("회차 경로가 있으면 이탈 알림이다", () => {
    expect(isOffRouteAlert(alert)).toBe(true);
  });

  it("세션 응답은 이탈 알림이 아니다", () => {
    expect(isOffRouteAlert(session)).toBe(false);
  });
});

describe("delayText", () => {
  it("더 걸리면 늘어난 분을 보여 준다", () => {
    expect(delayText(1860, 1200)).toBe("+11분");
  });

  it("더 빠르면 빨라진 분을 보여 준다", () => {
    expect(delayText(900, 1100)).toBe("3분 빨라요");
  });

  it("30초 안이면 비슷하다고 한다", () => {
    expect(delayText(1000, 980)).toBe("예정과 비슷해요");
  });
});

describe("shouldShowAlert", () => {
  it("맞게 탔다고 한 뒤에는 알림을 띄우지 않는다", () => {
    expect(shouldShowAlert(true)).toBe(false);
    expect(shouldShowAlert(false)).toBe(true);
  });
});
