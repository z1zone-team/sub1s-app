import { get, type RequestOptions } from "@/apis/client";
import type { PlaceSearchItem } from "./searchPlaces";

/** 반경 안에 역이 없으면 `nearestStation`이 없다 */
export type ReversePlaceItem = Omit<PlaceSearchItem, "nearestStation"> & {
  nearestStation?: PlaceSearchItem["nearestStation"];
};

export interface ReversePlaceParams {
  lat: number;
  lng: number;
}

/**
 * 좌표의 주소와 가까운 역 (지도에서 직접 찍기)
 * GET /api/v1/places/reverse
 */
export const reversePlace = (
  params: ReversePlaceParams,
  options?: RequestOptions
): Promise<ReversePlaceItem> => {
  return get<ReversePlaceItem>("/places/reverse", { ...params }, options);
};
