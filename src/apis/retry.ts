import { ApiError } from "./client";

const MAX_RETRIES = 1;

/**
 * 호출 한도(429)나 잘못된 요청(4xx)은 다시 보내도 같은 결과라 재시도하지 않는다.
 * 네트워크 오류와 서버 오류(5xx)만 한 번 더 시도한다
 */
export function shouldRetry(failureCount: number, error: Error): boolean {
  if (failureCount >= MAX_RETRIES) return false;
  if (error instanceof ApiError) {
    if (error.code === "REQUEST_CANCELLED") return false;
    return error.status === 0 || error.status >= 500;
  }
  return true;
}
