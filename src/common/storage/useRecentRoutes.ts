import { useState, useEffect, useCallback } from "react";
import { appStorage } from "./storage";

export const RECENT_ROUTES_STORAGE_KEY = "@sub1s/recent_routes";
export const MAX_RECENT_ROUTES = 10;

export interface RecentRouteItem {
  id: string;
  origin: string;
  originStationId?: string;
  destination: string;
  destStationId?: string;
  searchedAt: string;
}

export function useRecentRoutes() {
  const [routes, setRoutes] = useState<RecentRouteItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadRoutes = useCallback(async () => {
    setIsLoading(true);
    try {
      const raw = await appStorage.getItem(RECENT_ROUTES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as RecentRouteItem[];
        setRoutes(Array.isArray(parsed) ? parsed : []);
      } else {
        setRoutes([]);
      }
    } catch {
      setRoutes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoutes();
  }, [loadRoutes]);

  const addRoute = useCallback(
    async (item: Omit<RecentRouteItem, "id" | "searchedAt">) => {
      const newEntry: RecentRouteItem = {
        id: `${item.origin}-${item.destination}-${Date.now()}`,
        ...item,
        searchedAt: new Date().toISOString(),
      };

      setRoutes((prev) => {
        // 동일 출발지/도착지 중복 제거 후 최신 항목을 맨 앞에 추가
        const filtered = prev.filter(
          (r) => !(r.origin === item.origin && r.destination === item.destination)
        );
        const updated = [newEntry, ...filtered].slice(0, MAX_RECENT_ROUTES);
        void appStorage.setItem(RECENT_ROUTES_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const removeRoute = useCallback(async (id: string) => {
    setRoutes((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      void appStorage.setItem(RECENT_ROUTES_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRoutes = useCallback(async () => {
    setRoutes([]);
    await appStorage.removeItem(RECENT_ROUTES_STORAGE_KEY);
  }, []);

  return {
    routes,
    isLoading,
    addRoute,
    removeRoute,
    clearRoutes,
    reload: loadRoutes,
  };
}
