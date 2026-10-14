import { useEffect } from "react";
import { create } from "zustand";
import { appStorage } from "./storage";

export const RECENT_ROUTES_STORAGE_KEY = "@sub1s/recent_routes";
export const MAX_RECENT_ROUTES = 10;

export interface RecentRouteItem {
  id: string;
  origin: string;
  originStationId?: string;
  originLat?: number;
  originLng?: number;
  destination: string;
  destStationId?: string;
  /** 장소처럼 역이 아닌 도착지의 좌표 */
  destLat?: number;
  destLng?: number;
  searchedAt: string;
}

type NewRecentRoute = Omit<RecentRouteItem, "id" | "searchedAt">;

interface RecentRoutesState {
  routes: RecentRouteItem[];
  isLoading: boolean;
  error: string | null;
  addRoute: (item: NewRecentRoute) => Promise<void>;
  removeRoute: (id: string) => Promise<void>;
  clearRoutes: () => Promise<void>;
  reload: () => Promise<void>;
}

async function readRoutes(): Promise<RecentRouteItem[]> {
  const raw = await appStorage.getItem(RECENT_ROUTES_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function endpointKey(name: string, stationId?: string, lat?: number, lng?: number): string {
  if (stationId) return `station:${stationId}`;
  if (Number.isFinite(lat) && Number.isFinite(lng)) return `place:${lat},${lng}`;
  return `name:${name}`;
}

const routeKey = (route: NewRecentRoute): string =>
  `${endpointKey(route.origin, route.originStationId, route.originLat, route.originLng)}>${endpointKey(route.destination, route.destStationId, route.destLat, route.destLng)}`;

// 화면이 교체돼도 저장을 끝내고, 여러 화면의 읽기·쓰기가 이전 목록을 덮어쓰지 않게 순서를 보장한다.
let pending: Promise<void> = Promise.resolve();
export const useRecentRoutesStore = create<RecentRoutesState>((set) => {
  const enqueue = (work: () => Promise<void>): Promise<void> => {
    pending = pending.then(work).catch(() => {
      set({ error: "최근 검색 기록을 저장하거나 불러오지 못했어요.", isLoading: false });
    });
    return pending;
  };
  return {
    routes: [],
    isLoading: true,
    error: null,
    reload: () => enqueue(async () => {
      set({ isLoading: true });
      set({ routes: await readRoutes(), isLoading: false, error: null });
    }),
    addRoute: (item) => enqueue(async () => {
      const routes = await readRoutes();
      const entry: RecentRouteItem = {
        ...item,
        id: `${routeKey(item)}-${Date.now()}`,
        searchedAt: new Date().toISOString(),
      };
      const updated = [entry, ...routes.filter((route) => routeKey(route) !== routeKey(item))].slice(0, MAX_RECENT_ROUTES);
      await appStorage.setItem(RECENT_ROUTES_STORAGE_KEY, JSON.stringify(updated));
      set({ routes: updated, isLoading: false, error: null });
    }),
    removeRoute: (id) => enqueue(async () => {
      const updated = (await readRoutes()).filter((route) => route.id !== id);
      await appStorage.setItem(RECENT_ROUTES_STORAGE_KEY, JSON.stringify(updated));
      set({ routes: updated, isLoading: false, error: null });
    }),
    clearRoutes: () => enqueue(async () => {
      await appStorage.removeItem(RECENT_ROUTES_STORAGE_KEY);
      set({ routes: [], isLoading: false, error: null });
    }),
  };
});

export function useRecentRoutes() {
  const state = useRecentRoutesStore();
  const { reload } = state;
  useEffect(() => { void reload(); }, [reload]);
  return state;
}
