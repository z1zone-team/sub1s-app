import { get, patch, type RequestOptions } from "@/apis/client";

export interface NotificationSettings {
  /** 월말정산 푸시를 받을지. 기본 true */
  monthlySettlement: boolean;
}

/** GET /api/v1/users/me/notification-settings */
export const getNotificationSettings = (options?: RequestOptions): Promise<NotificationSettings> =>
  get<NotificationSettings>("/users/me/notification-settings", undefined, options);

/** PATCH /api/v1/users/me/notification-settings. 보낸 항목만 바뀐다 */
export const updateNotificationSettings = (
  body: Partial<NotificationSettings>
): Promise<NotificationSettings> =>
  patch<NotificationSettings>("/users/me/notification-settings", body);
