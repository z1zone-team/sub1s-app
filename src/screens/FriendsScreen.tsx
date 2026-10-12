import React from "react";
import { Alert, FlatList, Pressable, Share, View } from "react-native";
import { Button } from "@/common/components/Button";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { formatMonthDayKst } from "@/common/utils/format";
import {
  useFriendsQuery,
  useInviteTokenQuery,
  useRemoveFriendMutation,
  useResetInviteMutation,
} from "@/apis/queries/users/useFriends";
import { inviteLink, inviteMessage } from "@/features/friends/invite";

export function FriendsScreen() {
  const friends = useFriendsQuery();
  const invite = useInviteTokenQuery(true);
  const remove = useRemoveFriendMutation();
  const reset = useResetInviteMutation();

  const share = () => {
    if (!invite.data) return;
    void Share.share({ message: inviteMessage(inviteLink(invite.data.inviteToken)) });
  };

  const confirmReset = () => {
    Alert.alert("초대 링크를 새로 만들까요?", "이전에 보낸 링크는 더 이상 쓸 수 없어요.", [
      { text: "취소", style: "cancel" },
      { text: "새로 만들기", style: "destructive", onPress: () => reset.mutate() },
    ]);
  };

  const confirmRemove = (userId: string, nickname: string) => {
    Alert.alert(`${nickname}님과 친구를 끊을까요?`, "상대방의 친구 목록에서도 사라져요.", [
      { text: "취소", style: "cancel" },
      { text: "친구 끊기", style: "destructive", onPress: () => remove.mutate(userId) },
    ]);
  };

  return (
    <Screen edges={[]}>
      <FlatList
        data={friends.data?.friends ?? []}
        keyExtractor={(friend) => friend.userId}
        contentContainerClassName="px-5 pb-6"
        ListHeaderComponent={
          <View className="gap-3 py-4">
            <Text className="text-title-lg font-sans-bold">친구 {friends.data?.totalCount ?? 0}명</Text>
            <Button label="친구 초대하기" onPress={share} disabled={!invite.data} />
            <Pressable accessibilityRole="button" onPress={confirmReset} disabled={reset.isPending}>
              <Text className="text-center text-body-sm text-text-secondary">초대 링크 새로 만들기</Text>
            </Pressable>
            {friends.error ? <Text className="text-error">친구 목록을 불러오지 못했어요.</Text> : null}
            {remove.error ? <Text className="text-error">친구를 끊지 못했어요. 다시 시도해 주세요.</Text> : null}
          </View>
        }
        ListEmptyComponent={
          friends.isLoading ? null : (
            <Text className="py-6 text-center text-text-secondary">아직 친구가 없어요. 초대 링크를 보내 보세요</Text>
          )
        }
        renderItem={({ item }) => (
          <View className="min-h-row flex-row items-center justify-between border-b border-border py-2">
            <View>
              <Text className="text-subtitle font-sans-bold">{item.nickname}</Text>
              <Text className="text-small text-text-secondary">{formatMonthDayKst(item.friendedAt)}부터 친구</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => confirmRemove(item.userId, item.nickname)}
              disabled={remove.isPending}
            >
              <Text className="text-body-sm text-error">끊기</Text>
            </Pressable>
          </View>
        )}
      />
    </Screen>
  );
}
