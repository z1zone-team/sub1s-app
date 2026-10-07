import { ApiError } from "../../apis/client";

/**
 * 에러 객체로부터 사용자 친화적 메시지 추출
 */
export function getErrorMessage(error: unknown): string {
  if (!error) {
    return "알 수 없는 오류가 발생했습니다.";
  }

  if (error instanceof ApiError) {
    switch (error.code) {
      case "UNAUTHORIZED":
        return "로그인이 필요하거나 세션이 만료되었습니다.";
      case "TOO_MANY_REQUESTS":
        return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
      case "NOT_FOUND":
        return "요청하신 정보를 찾을 수 없습니다.";
      case "REQUEST_CANCELLED":
        return "요청이 취소되었습니다.";
      default:
        return error.message || "서버 통신 중 오류가 발생했습니다.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "오류가 발생했습니다.";
}
