import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import * as Haptics from "expo-haptics";
import { showSmartAlertNotification } from "@/common/notifications/notification-service";
import { subwaySocketClient } from "@/common/realtime/socket-client";
import type { SmartAlertPayload } from "@/common/realtime/types";
import {
  SMART_ALERT_BANNER_MS,
  smartAlertBody,
  smartAlertDelivery,
  smartAlertKind,
  smartAlertTitle,
} from "./smartAlert";

/**
 * 안내 중 서버가 보내는 smart_alert(환승, 하차 한 역 전)를 받는다.
 * 앱이 켜져 있으면 진동을 주고 `alert`에 잠깐 담아 배너로 보여 주고, 백그라운드면 로컬 알림을 띄운다
 */
export function useSmartAlert() {
  const [alert, setAlert] = useState<SmartAlertPayload | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setAlert(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    let cleanup: (() => void) | undefined;

    const onSmartAlert = (payload: SmartAlertPayload) => {
      if (smartAlertDelivery(AppState.currentState) === "NOTIFICATION") {
        void showSmartAlertNotification({
          kind: smartAlertKind(payload.type),
          title: smartAlertTitle(payload.type),
          body: smartAlertBody(payload),
        }).catch(() => undefined);
        return;
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      if (timer.current) clearTimeout(timer.current);
      setAlert(payload);
      timer.current = setTimeout(dismiss, SMART_ALERT_BANNER_MS);
    };

    void subwaySocketClient.retain().then((socket) => {
      if (!mounted) {
        subwaySocketClient.release();
        return;
      }
      socket.on("smart_alert", onSmartAlert);
      cleanup = () => {
        socket.off("smart_alert", onSmartAlert);
        subwaySocketClient.release();
      };
    });

    return () => {
      mounted = false;
      cleanup?.();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [dismiss]);

  return { alert, dismiss };
}
