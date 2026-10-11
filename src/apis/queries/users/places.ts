import { del, get, put, type RequestOptions } from "@/apis/client";

export type PlaceKind = "HOME" | "SCHOOL";

export interface UserPlace {
  kind: PlaceKind;
  name: string;
  stationId: string | null;
  lat: number | null;
  lng: number | null;
}

export interface SavePlaceBody {
  name: string;
  stationId?: string;
  lat?: number;
  lng?: number;
}

/** GET /api/v1/users/me/places. 저장한 종류만 온다 */
export const getPlaces = async (options?: RequestOptions): Promise<UserPlace[]> => {
  const data = await get<{ places: UserPlace[] }>("/users/me/places", undefined, options);
  return data.places;
};

/** PUT /api/v1/users/me/places/:kind. 같은 종류가 있으면 교체한다 */
export const savePlace = (kind: PlaceKind, body: SavePlaceBody): Promise<UserPlace> =>
  put<UserPlace>(`/users/me/places/${kind}`, body);

/** DELETE /api/v1/users/me/places/:kind */
export const removePlace = (kind: PlaceKind): Promise<{ kind: PlaceKind; removed: boolean }> =>
  del<{ kind: PlaceKind; removed: boolean }>(`/users/me/places/${kind}`);
