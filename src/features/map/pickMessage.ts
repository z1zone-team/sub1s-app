import { ApiError } from "@/apis/client";

/** 지도에서 고른 곳의 주소를 받지 못했을 때 보여 줄 문구 */
export function pickErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "PLACE_OUT_OF_SERVICE_AREA") return "이 근처에는 지하철역이 없어요. 다른 곳을 골라 주세요.";
    if (error.status === 429) return "요청이 너무 잦아요. 잠시 후 다시 시도해 주세요.";
  }
  return "주소를 불러오지 못했어요. 다시 시도해 주세요.";
}
