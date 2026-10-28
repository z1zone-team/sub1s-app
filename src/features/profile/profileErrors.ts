import { ApiError } from "@/apis/client";

/** 프로필(이름, 닉네임) 저장이 실패했을 때 보여 줄 문구 */
export function profileSaveErrorMessage(error: Error): string {
  if (error instanceof ApiError && error.code === "NICKNAME_TAKEN") return "이미 사용 중인 닉네임이에요";
  if (error instanceof ApiError && error.status === 400) return "입력한 내용을 다시 확인해 주세요";
  return "저장하지 못했어요. 다시 시도해 주세요.";
}
