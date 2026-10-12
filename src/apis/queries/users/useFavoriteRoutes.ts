import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/expo";
import { queryKeys } from "@/constants/queryKeys";
import {
  getFavoriteRoutes,
  removeFavoriteRoute,
  saveFavoriteRoute,
  type SaveFavoriteRouteBody,
} from "./favoriteRoutes";

export const useFavoriteRoutesQuery = () => {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: queryKeys.users.favoriteRoutes(),
    queryFn: ({ signal }) => getFavoriteRoutes({ signal }),
    enabled: !!isSignedIn,
    staleTime: 5 * 60_000,
  });
};

export const useSaveFavoriteRouteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SaveFavoriteRouteBody) => saveFavoriteRoute(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.favoriteRoutes() }),
  });
};

export const useRemoveFavoriteRouteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeFavoriteRoute(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.favoriteRoutes() }),
  });
};
