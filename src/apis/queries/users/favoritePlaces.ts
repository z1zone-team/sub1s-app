import { del, get, put, type RequestOptions } from "@/apis/client";
import type { FavoriteEndpoint, FavoriteEndpointBody } from "./favoriteRoutes";

export interface FavoritePlace extends FavoriteEndpoint {
  id: string;
  /** 저장한 시각 (한국 시간 ISO-8601) */
  createdAt: string;
}

export interface FavoritePlacesResponse {
  places: FavoritePlace[];
  /** 저장할 수 있는 최대 개수 */
  limit: number;
}

/** GET /api/v1/users/me/favorites/places. 최근에 저장한 순 */
export const getFavoritePlaces = (options?: RequestOptions): Promise<FavoritePlacesResponse> =>
  get<FavoritePlacesResponse>("/users/me/favorites/places", undefined, options);

/** PUT /api/v1/users/me/favorites/places. 같은 곳이 이미 있으면 그 항목을 `alreadySaved`로 돌려준다. 가득 차면 409 FAVORITE_PLACE_LIMIT */
export const saveFavoritePlace = (body: FavoriteEndpointBody): Promise<FavoritePlace & { alreadySaved: boolean }> =>
  put<FavoritePlace & { alreadySaved: boolean }>("/users/me/favorites/places", body);

/** DELETE /api/v1/users/me/favorites/places/:id. 없거나 남의 것이어도 200이고 removed가 false */
export const removeFavoritePlace = (id: string): Promise<{ id: string; removed: boolean }> =>
  del<{ id: string; removed: boolean }>(`/users/me/favorites/places/${id}`);
