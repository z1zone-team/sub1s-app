import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { queryKeys } from "@/constants/queryKeys";
import { getPlaces, removePlace, savePlace, type PlaceKind, type SavePlaceBody } from "./places";

export const useUserPlacesQuery = () => {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: queryKeys.users.places(),
    queryFn: ({ signal }) => getPlaces({ signal }),
    enabled: !!isSignedIn,
    staleTime: 5 * 60_000,
  });
};

export const useSavePlaceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, body }: { kind: PlaceKind; body: SavePlaceBody }) => savePlace(kind, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.places() }),
  });
};

export const useRemovePlaceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (kind: PlaceKind) => removePlace(kind),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.places() }),
  });
};
