import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import {
  scheduleStationAlert,
  triggerOffRouteAlert,
  getExpoPushTokenAsync,
} from "./notification-service";
import { setupNotificationChannels, NOTIFICATION_CHANNELS } from "./channels";

describe("Notification Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize notification channels for Android", async () => {
    await setupNotificationChannels();
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledTimes(
      Object.keys(NOTIFICATION_CHANNELS).length
    );
  });

  it("should schedule station transfer alert with Haptics feedback", async () => {
    const id = await scheduleStationAlert({
      type: "TRANSFER",
      stationName: "신도림",
      lineName: "2호선",
      secondsFromNow: 60,
    });

    expect(id).toBe("notif-1234");
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Success
    );
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: "[환승 안내] 곧 신도림역에 도착합니다",
        body: "2호선 환승을 위해 하차 준비를 해주세요.",
        data: {
          type: "TRANSFER",
          stationName: "신도림",
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 60,
        channelId: NOTIFICATION_CHANNELS.TRANSFER.id,
      },
    });
  });

  it("should trigger immediate emergency alert when off-route is detected", async () => {
    const id = await triggerOffRouteAlert("영등포");

    expect(id).toBe("notif-1234");
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Error
    );
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: "⚠️ [오탑승 감지] 계획된 경로를 이탈했습니다!",
        body: "현재 탑승하신 열차가 예정된 경로와 다른 영등포역 방면입니다.",
        data: {
          type: "OFFROUTE",
          stationName: "영등포",
        },
      },
      trigger: {
        channelId: NOTIFICATION_CHANNELS.OFFROUTE.id,
      },
    });
  });

  it("should retrieve Expo Push token when permissions are granted", async () => {
    const token = await getExpoPushTokenAsync();
    expect(token).toBe("ExponentPushToken[mock-token-123]");
    expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
  });
});
