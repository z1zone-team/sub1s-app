import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import { NOTIFICATION_CHANNELS } from "./channels";

export interface StationAlertParams {
  type: "TRANSFER" | "ALIGHT";
  stationName: string;
  lineName?: string;
  secondsFromNow?: number;
}

/**
 * 환승역 또는 하차역 1개 역 전 로컬 알림 스케줄링
 */
export async function scheduleStationAlert(
  params: StationAlertParams
): Promise<string> {
  const isTransfer = params.type === "TRANSFER";
  const channel = isTransfer
    ? NOTIFICATION_CHANNELS.TRANSFER
    : NOTIFICATION_CHANNELS.ALIGHT;

  const title = isTransfer
    ? `[환승 안내] 곧 ${params.stationName}역에 도착합니다`
    : `[하차 안내] 목적지 ${params.stationName}역에 곧 도착합니다`;

  const body = isTransfer
    ? `${params.lineName ? `${params.lineName} 환승을 위해 ` : ""}하차 준비를 해주세요.`
    : `목적지에 도착합니다. 두고 가시는 물건이 없는지 확인해 주세요.`;

  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // 기기 Haptics 미지원 시 무시
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: {
        type: params.type,
        stationName: params.stationName,
      },
    },
    trigger:
      params.secondsFromNow && params.secondsFromNow > 0
        ? {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: params.secondsFromNow,
            channelId: channel.id,
          }
        : {
            channelId: channel.id,
          },
  });

  return notificationId;
}

export interface SmartAlertNotificationParams {
  kind: "TRANSFER" | "ALIGHT";
  title: string;
  body: string;
}

/**
 * 서버가 보낸 환승, 하차 알림을 앱이 백그라운드일 때 즉시 로컬 알림으로 띄운다.
 * 진동은 채널 설정이 맡는다
 */
export async function showSmartAlertNotification(
  params: SmartAlertNotificationParams
): Promise<string> {
  const channel =
    params.kind === "TRANSFER"
      ? NOTIFICATION_CHANNELS.TRANSFER
      : NOTIFICATION_CHANNELS.ALIGHT;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: params.title,
      body: params.body,
      data: { type: params.kind },
    },
    trigger: { channelId: channel.id },
  });
}

/**
 * 오탑승/경로 이탈 즉시 긴급 알림 및 강한 진동 트리거
 */
export async function triggerOffRouteAlert(
  currentStation: string,
  detail?: string
): Promise<string> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // 기기 Haptics 미지원 시 무시
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "⚠️ [오탑승 감지] 계획된 경로를 이탈했습니다!",
      body:
        detail ??
        `현재 탑승하신 열차가 예정된 경로와 다른 ${currentStation}역 방면입니다.`,
      data: {
        type: "OFFROUTE",
        stationName: currentStation,
      },
    },
    trigger: {
      channelId: NOTIFICATION_CHANNELS.OFFROUTE.id,
    },
  });

  return notificationId;
}

/**
 * Expo Push 토큰 획득 (권한 요청 포함)
 */
export async function getExpoPushTokenAsync(): Promise<string | null> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch {
    return null;
  }
}
