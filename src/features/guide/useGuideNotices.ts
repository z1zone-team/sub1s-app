import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { showGuideNotification } from "@/common/notifications/notification-service";
import { guideNotice, type GuideNoticeInput } from "./guideNotice";

/** 안내(세션)마다 이미 보낸 알림 id. 안내 화면을 다시 열어도 같은 알림을 또 보내지 않는다 */
const sentBySession = new Map<string, Set<string>>();

/** 이미 보낸 알림이면 false, 아니면 보낸 것으로 적고 true. 다른 안내의 기록은 지운다 */
export function markNoticeSent(sessionId: string, noticeId: string): boolean {
  for (const key of sentBySession.keys()) {
    if (key !== sessionId) sentBySession.delete(key);
  }
  const sent = sentBySession.get(sessionId) ?? new Set<string>();
  sentBySession.set(sessionId, sent);
  if (sent.has(noticeId)) return false;
  sent.add(noticeId);
  return true;
}

export function resetSentNotices(): void {
  sentBySession.clear();
}

/**
 * 안내 중 앱이 백그라운드(또는 화면이 꺼진 상태)일 때 단계가 바뀌면 걷기, 승차 알림을 띄운다. 앱이 화면에 있으면 안내 화면이 같은 내용을 보여 주므로
 * 보내지 않고, 백그라운드로 나간 뒤 아직 못 본 단계의 알림은 나가는 순간 보낸다
 */
export function useGuideNotices(sessionId: string, input: GuideNoticeInput): void {
  const [appActive, setAppActive] = useState(AppState.currentState === "active");
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => setAppActive(state === "active"));
    return () => subscription.remove();
  }, []);

  const notice = guideNotice(input);
  const noticeId = notice?.id;
  const title = notice?.title;
  const body = notice?.body;

  useEffect(() => {
    if (appActive || !noticeId || !title || !body) return;
    if (!markNoticeSent(sessionId, noticeId)) return;
    void showGuideNotification({ title, body }).catch(() => undefined);
  }, [appActive, sessionId, noticeId, title, body]);
}
