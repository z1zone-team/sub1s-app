import { useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import { setupNotificationChannels } from "./channels";
import { getExpoPushTokenAsync } from "./notification-service";

/**
 * 알림 권한 및 포그라운드 수신/탭 리스너 훅
 */
export function useNotifications() {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);

  useEffect(() => {
    void setupNotificationChannels();

    void getExpoPushTokenAsync().then((token) => {
      if (token) {
        setPushToken(token);
        setPermissionGranted(true);
      }
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log("[Notification tapped]:", data);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return {
    pushToken,
    permissionGranted,
  };
}
