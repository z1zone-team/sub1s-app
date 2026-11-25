import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/expo";
import { queryKeys } from "@/constants/queryKeys";
import type { FavoriteEndpointBody } from "./favoriteRoutes";
import { getFavoritePlaces, removeFavoritePlace, saveFavoritePlace } from "./favoritePlaces";

export const useFavoritePlacesQuery = () => {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: queryKeys.users.favoritePlaces(),
    queryFn: ({ signal }) => getFavoritePlaces({ signal }),
    enabled: !!isSignedIn,
    staleTime: 5 * 60_000,
  });
};

export const useSaveFavoritePlaceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: FavoriteEndpointBody) => saveFavoritePlace(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.favoritePlaces() }),
  });
};

export const useRemoveFavoritePlaceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeFavoritePlace(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.favoritePlaces() }),
  });
};
