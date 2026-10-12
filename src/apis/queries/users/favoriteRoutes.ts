import { del, get, put, type RequestOptions } from "@/apis/client";

export interface FavoriteEndpointBody {
  name: string;
  stationId?: string;
  lat?: number;
  lng?: number;
}

export interface SaveFavoriteRouteBody {
  origin: FavoriteEndpointBody;
  destination: FavoriteEndpointBody;
}

export interface FavoriteEndpoint {
  name: string;
  stationId: string | null;
  lat: number | null;
  lng: number | null;
}

export interface FavoriteRoute {
  id: string;
  origin: FavoriteEndpoint;
  destination: FavoriteEndpoint;
  /** 저장한 시각 (한국 시간 ISO-8601) */
  createdAt: string;
}

export interface FavoriteRoutesResponse {
  favorites: FavoriteRoute[];
  /** 저장할 수 있는 최대 개수 */
  limit: number;
}

/** GET /api/v1/users/me/favorites/routes. 최근에 저장한 순 */
export const getFavoriteRoutes = (options?: RequestOptions): Promise<FavoriteRoutesResponse> =>
  get<FavoriteRoutesResponse>("/users/me/favorites/routes", undefined, options);

/** PUT /api/v1/users/me/favorites/routes. 같은 경로가 이미 있으면 그 항목을 `alreadySaved`로 돌려준다. 가득 차면 409 FAVORITE_ROUTE_LIMIT */
export const saveFavoriteRoute = (body: SaveFavoriteRouteBody): Promise<FavoriteRoute & { alreadySaved: boolean }> =>
  put<FavoriteRoute & { alreadySaved: boolean }>("/users/me/favorites/routes", body);

/** DELETE /api/v1/users/me/favorites/routes/:id. 없거나 남의 것이어도 200이고 removed가 false */
export const removeFavoriteRoute = (id: string): Promise<{ id: string; removed: boolean }> =>
  del<{ id: string; removed: boolean }>(`/users/me/favorites/routes/${id}`);
