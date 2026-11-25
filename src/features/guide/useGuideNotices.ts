import { useEffect } from "react";
import * as Speech from "expo-speech";
import { appStorage } from "@/common/storage/storage";
import { showGuideNotification } from "@/common/notifications/notification-service";
import { guideNotice, type GuideNotice, type GuideNoticeInput } from "./guideNotice";

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

export const GUIDE_VOICE_KEY = "guide_voice_enabled";
let pendingNotification = Promise.resolve();

export function useGuideAnnouncement(sessionId: string, notice: GuideNotice | null): void {
  const id = notice?.id;
  const title = notice?.title;
  const body = notice?.body;
  useEffect(() => {
    if (!id || !title || !body || !markNoticeSent(sessionId, id)) return;
    pendingNotification = pendingNotification.then(async () => {
      if (!sentBySession.get(sessionId)?.has(id)) return;
      await showGuideNotification({ title, body });
    }).catch(() => { sentBySession.get(sessionId)?.delete(id); });
    void appStorage.getItem(GUIDE_VOICE_KEY).then(enabled => {
      if (enabled === "true") Speech.speak([title, body].join(". "), { language: "ko-KR" });
    }).catch(() => undefined);
  }, [sessionId, id, title, body]);
}

export function useGuideNotices(sessionId: string, input: GuideNoticeInput): void {
  useGuideAnnouncement(sessionId, { id: "start", title: "길안내를 시작합니다", body: "경로를 따라 이동해 주세요." });
  useGuideAnnouncement(sessionId, guideNotice(input));
}
