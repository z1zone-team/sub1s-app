import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/** 소리는 지정하지 않는다. "default"를 문자열로 주면 그 이름의 소리 파일을 찾다가 경고가 나므로, 키를 빼서 시스템 기본음을 쓴다 */
export const NOTIFICATION_CHANNELS = {
  TRANSFER: {
    id: "subway-transfer",
    name: "지하철 환승 안내",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  },
  ALIGHT: {
    id: "subway-alight",
    name: "지하철 하차 안내",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 300, 200, 300],
  },
  OFFROUTE: {
    id: "subway-offroute",
    name: "오탑승 긴급 경고",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 200, 500, 200, 500],
  },
  GUIDE: {
    id: "subway-guide",
    name: "안내 중 이동 안내",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250],
  },
  SETTLEMENT: {
    id: "subway-settlement",
    name: "월말 정산 및 통계",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200],
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
    });
  }
}
