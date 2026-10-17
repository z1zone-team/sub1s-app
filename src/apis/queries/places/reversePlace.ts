import { get, type RequestOptions } from "@/apis/client";
import type { PlaceSearchItem } from "./searchPlaces";

export interface ReversePlaceParams {
  lat: number;
  lng: number;
}

/**
 * 좌표의 주소와 가까운 역 (지도에서 직접 찍기)
 * GET /api/v1/places/reverse
 * 반경 안에 역이 없으면 422 PLACE_OUT_OF_SERVICE_AREA
 */
export const reversePlace = (
  params: ReversePlaceParams,
  options?: RequestOptions
): Promise<PlaceSearchItem> => {
  return get<PlaceSearchItem>("/places/reverse", { ...params }, options);
};
