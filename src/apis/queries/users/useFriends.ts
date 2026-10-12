import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/expo";
import { queryKeys } from "@/constants/queryKeys";
import { acceptInvite, getFriends, getInviteToken, removeFriend, resetInviteToken } from "./friends";

export const useFriendsQuery = () => {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: queryKeys.users.friends(),
    queryFn: ({ signal }) => getFriends({ signal }),
    enabled: !!isSignedIn,
    staleTime: 60_000,
  });
};

export const useInviteTokenQuery = (enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.users.inviteToken(),
    queryFn: ({ signal }) => getInviteToken({ signal }),
    enabled,
    staleTime: 5 * 60_000,
  });

/** 친구가 바뀌면 친구만 보기 랭킹도 달라지므로 같이 새로 받는다 */
function useInvalidateFriends() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.users.friends() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.ranking.all });
  };
}

export const useRemoveFriendMutation = () => {
  const invalidate = useInvalidateFriends();
  return useMutation({ mutationFn: removeFriend, onSuccess: invalidate });
};

export const useAcceptInviteMutation = () => {
  const invalidate = useInvalidateFriends();
  return useMutation({ mutationFn: acceptInvite, onSuccess: invalidate });
};

export const useResetInviteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resetInviteToken,
    onSuccess: (data) => queryClient.setQueryData(queryKeys.users.inviteToken(), data),
  });
};
