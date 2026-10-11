import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { updateProfile, type MyProfile, type UpdateProfileRequest } from "./updateProfile";

export const useUpdateProfileMutation = (): UseMutationResult<MyProfile, Error, UpdateProfileRequest> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => updateProfile(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.ranking.all });
    },
  });
};
