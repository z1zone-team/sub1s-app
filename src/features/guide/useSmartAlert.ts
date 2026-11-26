import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { appStorage } from "@/common/storage/storage";
import { showSmartAlertNotification } from "@/common/notifications/notification-service";
import { subwaySocketClient } from "@/common/realtime/socket-client";
import type { SmartAlertPayload } from "@/common/realtime/types";
import {
  SMART_ALERT_BANNER_MS,
  smartAlertBody,
  smartAlertKind,
  smartAlertShowsBanner,
  smartAlertTitle,
} from "./smartAlert";
import { GUIDE_VOICE_KEY } from "./useGuideNotices";

/**
 * 안내 중 서버가 보내는 smart_alert(환승, 하차 한 역 전)를 받는다.
 * 승차 안내처럼 같은 자리의 알림을 늘 띄우고(음성 안내를 켰으면 읽어 준다), 앱이 켜져 있으면 진동과 함께 `alert`에 잠깐 담아 배너로도 보여 준다
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
      const title = smartAlertTitle(payload.type);
      const body = smartAlertBody(payload);
      void showSmartAlertNotification({ kind: smartAlertKind(payload.type), title, body }).catch(() => undefined);
      void appStorage.getItem(GUIDE_VOICE_KEY).then((enabled) => {
        if (enabled === "true") Speech.speak([title, body].join(". "), { language: "ko-KR" });
      }).catch(() => undefined);
      if (!smartAlertShowsBanner(AppState.currentState)) return;
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
