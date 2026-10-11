import { ApiError } from "@/apis/client";

export const INVITE_WEB_BASE = "https://sub1s.com/invite";

/** 서버는 토큰만 주므로 초대 링크는 앱이 만든다 */
export function inviteLink(token: string): string {
  return `${INVITE_WEB_BASE}/${encodeURIComponent(token)}`;
}

export function inviteMessage(link: string): string {
  return `Sub1S에서 같이 이동 기록을 겨뤄요! 친구로 추가하려면 눌러 주세요: ${link}`;
}

/** 서버 형식(16자, 영문, 숫자, -, _)에 맞는 토큰만 받는다 */
export function isInviteToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{16}$/.test(value);
}

/** 수락 오류를 사용자 문구로 바꾼다 */
export function acceptErrorMessage(error: Error): string {
  if (error instanceof ApiError) {
    if (error.code === "SELF_INVITE") return "내 초대 링크예요. 친구에게 보내 주세요";
    if (error.code === "INVITE_NOT_FOUND") return "만료되었거나 없는 초대 링크예요";
    if (error.status === 400) return "올바르지 않은 초대 링크예요";
  }
  return "친구 추가에 실패했어요. 다시 시도해 주세요";
}
