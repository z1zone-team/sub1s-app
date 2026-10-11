import { useEffect } from "react";
import { Platform } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import * as Notifications from "expo-notifications";
import { registerPushToken, unregisterPushToken } from "@/apis/mutations/notifications/pushTokens";
import { ENV } from "@/constants/env";
import { setupNotificationChannels } from "./channels";
import { isEasProjectId, pushTargetOf, type PushTarget } from "./pushRoute";

/** 이 실행에서 서버에 등록한 토큰. 로그아웃할 때 해제한다 */
let registeredToken: string | null = null;

async function readPushToken(): Promise<string | null> {
  if (!isEasProjectId(ENV.EAS_PROJECT_ID)) return null;
  try {
    const current = await Notifications.getPermissionsAsync();
    const status = current.status === "granted" ? current.status : (await Notifications.requestPermissionsAsync()).status;
    if (status !== "granted") return null;
    return (await Notifications.getExpoPushTokenAsync({ projectId: ENV.EAS_PROJECT_ID })).data;
  } catch {
    return null;
  }
}

/** 로그인한 동안 앱을 열 때마다 이 기기의 푸시 토큰을 서버에 등록한다. 권한이 없거나 프로젝트 ID가 없으면 조용히 건너뛴다 */
export function usePushRegistration(): void {
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;

    void (async () => {
      await setupNotificationChannels();
      const token = await readPushToken();
      if (!token || cancelled) return;
      try {
        await registerPushToken(token, Platform.OS === "ios" ? "ios" : "android");
        registeredToken = token;
      } catch {
        // 다음에 앱을 열 때 다시 등록한다
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);
}

/** 로그아웃 전에 부른다. 해제에 실패해도 로그아웃은 막지 않는다 */
export async function unregisterCurrentPushToken(): Promise<void> {
  const token = registeredToken;
  if (!token) return;
  registeredToken = null;
  try {
    await unregisterPushToken(token);
  } catch {
    // 서버가 DeviceNotRegistered로 정리하거나 다음 등록 때 옮겨진다
  }
}

/** 알림을 눌렀을 때 열 화면을 알려 준다. 앱이 꺼져 있다가 알림으로 열린 경우도 처리한다 */
export function usePushNavigation(open: (target: NonNullable<PushTarget>) => void): void {
  useEffect(() => {
    const handle = (response: Notifications.NotificationResponse | null) => {
      const target = pushTargetOf(response?.notification.request.content.data);
      if (target) open(target);
    };

    void Notifications.getLastNotificationResponseAsync().then(handle).catch(() => undefined);
    const subscription = Notifications.addNotificationResponseReceivedListener(handle);
    return () => subscription.remove();
  }, [open]);
}
