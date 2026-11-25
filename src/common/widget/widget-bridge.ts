import { APP_SCHEME } from "@/constants/appScheme";
import { appStorage } from "../storage/storage";
import type { WidgetSnapshot } from "./widget-types";

export const WIDGET_SNAPSHOT_KEY = "@sub1s/widget_snapshot";

/**
 * 앱과 홈 화면 위젯(iOS App Group / Android Shared Storage)이 공유하는 스냅샷 저장
 */
export async function saveWidgetSnapshot(snapshot: WidgetSnapshot): Promise<void> {
  const payload = {
    ...snapshot,
    updatedAt: new Date().toISOString(),
  };
  await appStorage.setItem(WIDGET_SNAPSHOT_KEY, JSON.stringify(payload));
}

/**
 * 저장된 위젯 스냅샷 읽기
 */
export async function getWidgetSnapshot(): Promise<WidgetSnapshot | null> {
  try {
    const raw = await appStorage.getItem(WIDGET_SNAPSHOT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WidgetSnapshot;
  } catch {
    return null;
  }
}

/**
 * 위젯 탭 시 앱을 실행시키는 딥링크 URL 생성 규약
 */
export function createWidgetDeepLink(
  action: "next-train" | "route",
  params?: Record<string, string>
): string {
  const searchParams = new URLSearchParams(params ?? {});
  const queryString = searchParams.toString();
  return `${APP_SCHEME}://widget/${action}${queryString ? `?${queryString}` : ""}`;
}
