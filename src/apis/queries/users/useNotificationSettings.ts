import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { queryKeys } from "@/constants/queryKeys";
import {
  getNotificationSettings,
  updateNotificationSettings,
  type NotificationSettings,
} from "./notificationSettings";

export const useNotificationSettingsQuery = () => {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: queryKeys.users.notificationSettings(),
    queryFn: ({ signal }) => getNotificationSettings({ signal }),
    enabled: !!isSignedIn,
    staleTime: 5 * 60_000,
  });
};

export const useUpdateNotificationSettingsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<NotificationSettings>) => updateNotificationSettings(body),
    onSuccess: (data) => queryClient.setQueryData(queryKeys.users.notificationSettings(), data),
  });
};
