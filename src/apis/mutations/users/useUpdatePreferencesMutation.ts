import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import type { Preferences } from "@/apis/queries/users/getPreferences";
import { queryKeys } from "@/constants/queryKeys";
import { updatePreferences } from "./updatePreferences";

export const useUpdatePreferencesMutation = (): UseMutationResult<Preferences, Error, Preferences> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Preferences) => updatePreferences(body),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.users.preferences(), data);
    },
  });
};
