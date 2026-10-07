import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const NOTIFICATION_CHANNELS = {
  TRANSFER: {
    id: "subway-transfer",
    name: "지하철 환승 안내",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: "default",
  },
  ALIGHT: {
    id: "subway-alight",
    name: "지하철 하차 안내",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 300, 200, 300],
    sound: "default",
  },
  OFFROUTE: {
    id: "subway-offroute",
    name: "오탑승 긴급 경고",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 200, 500, 200, 500],
    sound: "default",
  },
  SETTLEMENT: {
    id: "subway-settlement",
    name: "월말 정산 및 통계",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200],
    sound: "default",
  },
} as const;

export type NotificationChannelKey = keyof typeof NOTIFICATION_CHANNELS;

/**
 * Android 알림 채널 초기화 (OS가 Android일 때만 실행)
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== "android") return;

  for (const channel of Object.values(NOTIFICATION_CHANNELS)) {
    await Notifications.setNotificationChannelAsync(channel.id, {
      name: channel.name,
      importance: channel.importance,
      vibrationPattern: channel.vibrationPattern as unknown as number[],
      sound: channel.sound,
    });
  }
}
