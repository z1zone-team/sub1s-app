import * as Notifications from "expo-notifications";
import { GUIDE_STEP_IDENTIFIER } from "./notification-service";

// 포그라운드 알림 표시 정책 (앱 실행 중에도 소리/알림 표시)
Notifications.setNotificationHandler({
  handleNotification: async notification => ({
    shouldShowBanner: true,
    shouldShowList: notification.request.identifier !== GUIDE_STEP_IDENTIFIER,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
