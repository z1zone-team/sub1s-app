import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useAuth } from "@clerk/expo";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTravelStatsQuery } from "@/apis/queries/profile/useTravelStatsQuery";
import { useRankingQuery } from "@/apis/queries/ranking/useRankingQuery";
import { DesignIcon } from "@/common/components/DesignIcon";
import { LoadFailView } from "@/common/components/LoadFailView";
import { LoadingGhost } from "@/common/components/LoadingGhost";
import { LoginRequired } from "@/common/components/LoginRequired";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { InviteSheet } from "@/features/ranking/components/InviteSheet";
import { useRankingRealtime } from "@/features/ranking/useRankingRealtime";
import { PodiumColumn } from "@/features/ranking/components/PodiumColumn";
import { MoodFace } from "@/features/ranking/components/RankCharacters";
import { RankRow } from "@/features/ranking/components/RankRow";
import {
  captionText,
  kstYearMonth,
  MOOD_LEVELS,
  moodOf,
  periodKeyOf,
  podium,
  rowsAfterPodium,
  SCOPES,
  type RankingScope,
} from "@/features/ranking/rankingView";
import { cn } from "@/lib/cn";
import { useTheme } from "@/theme";
import type { RootStackParamList } from "@/navigation/navigation-types";

/** 프로토타입 Ranking.dc.html: 제목과 친구 초대, 월간/전체 탭, 시상대, 4위부터 목록, 표정 설명 */
export function RankingScreen() {
  const { colors } = useTheme();
  const { isSignedIn } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [scope, setScope] = useState<RankingScope>("MONTHLY");
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const { year, month } = kstYearMonth(Date.now());

  const ranking = useRankingQuery({
    periodType: scope,
    periodKey: periodKeyOf(scope, year, month),
    friendsOnly,
    limit: 20,
  });
  const monthStats = useTravelStatsQuery("MONTH");
  // 화면이 보이는 동안 다른 사용자의 이동으로 순위가 바뀌면 바로 다시 불러온다
  const focused = useIsFocused();
  useRankingRealtime(Boolean(isSignedIn) && focused);

  if (!isSignedIn) {
    return <LoginRequired description="로그인하면 랭킹을 보고 친구와 겨룰 수 있어요" />;
  }

  const data = ranking.data;
  const loadFailed = !!ranking.error && !data;
  const top = podium(data);
  const rows = rowsAfterPodium(data);
  const mood = moodOf(monthStats.data?.totalDistanceKm ?? 0);
  const order = [2, 1, 3] as const;
  const travelAction = (userId: string | undefined, nickname: string, isMe: boolean) => {
    if (isMe) return () => navigation.navigate("Timeline");
    if (!userId) return undefined;
    return () => navigation.navigate("RankedUserTravel", { userId, nickname, period: scope === "MONTHLY" ? "MONTH" : "ALL" });
  };

  return (
    <Screen>
      <View className="flex-row items-center justify-between px-5 pt-2">
        <Text className="text-display-sm font-sans-bold">랭킹</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setInviteOpen(true)}
          className="h-11 flex-row items-center gap-1 rounded-pill border border-border bg-bg px-3.5"
        >
          <DesignIcon name="plus" size={16} />
          <Text className="text-body font-sans-bold">친구</Text>
        </Pressable>
      </View>

      <View className="flex-row items-center justify-between px-5 pt-3.5">
        <View className="flex-row gap-5">
          {SCOPES.map((item) => {
            const selected = item.value === scope;
            return (
              <Pressable
                key={item.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setScope(item.value)}
                className={cn("h-11 justify-center border-b-[2.5px]", selected ? "border-primary" : "border-transparent")}
              >
                <Text className={cn("text-heading font-sans-bold", selected ? "text-text" : "text-text-secondary")}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: friendsOnly }}
          onPress={() => setFriendsOnly((value) => !value)}
          className={cn(
            "h-11 flex-row items-center gap-1.5 rounded-pill border px-3",
            friendsOnly ? "border-primary bg-primary" : "border-border bg-bg"
          )}
        >
          <DesignIcon name="friends" size={14} strokeWidth={2.2} color={friendsOnly ? colors.onPrimary : colors.text} />
          <Text className={cn("text-body-sm font-sans-bold", friendsOnly ? "text-on-primary" : "text-text")}>친구만 보기</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="flex-grow pb-6" showsVerticalScrollIndicator={false}>
        {loadFailed ? null : (
          <Text className="mx-5 mt-2.5 text-small text-text-secondary">
            {captionText(scope, month, friendsOnly, data?.totalUsers)}
          </Text>
        )}

        {loadFailed ? (
          <LoadFailView
            title="랭킹을 불러오지 못했어요"
            body={"인터넷 연결을 확인하고 다시 시도해 주세요.\n지하 구간에서는 연결이 잠시 끊길 수 있어요."}
            onRetry={() => void ranking.refetch()}
          />
        ) : ranking.isLoading ? (
          <LoadingGhost minHeight={460} />
        ) : (
          <>
        {ranking.error ? (
          <Text className="mx-5 mt-3 text-error">랭킹을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</Text>
        ) : null}

        {top.length > 0 ? (
          <View className="mx-4 mt-4.5 flex-row items-end gap-2">
            {order.map((rank) => {
              const entry = top.find((item) => item.rank === rank);
              if (!entry) return <View key={rank} className="flex-1" />;
              return <PodiumColumn key={`${scope}-${friendsOnly}-${rank}`} rank={rank} name={entry.name} points={entry.points} km={entry.km} onPress={travelAction(entry.userId, entry.name, entry.isMe)} />;
            })}
          </View>
        ) : !ranking.isLoading ? (
          <Text className="py-6 text-center text-text-secondary">아직 랭킹에 오른 사람이 없어요</Text>
        ) : null}

        {rows.length > 0 ? (
          <View className="mx-3 mt-2">
            {rows.map((row, index) =>
              row.kind === "GAP" ? (
                <Text key={`gap-${index}`} className="py-1.5 text-center text-text-secondary">
                  ···
                </Text>
              ) : (
                <RankRow key={`${row.rank}-${index}`} rank={row.rank} name={row.nickname} value={row.value} sub={row.sub} isMe={row.isMe} onPress={travelAction(row.userId, row.nickname, row.isMe)} />
              )
            )}
          </View>
        ) : null}

        <View className="mx-3 mt-6 rounded-xl bg-surface px-5 py-5.5">
          <View className="flex-row items-baseline justify-between">
            <Text className="text-subtitle font-sans-bold">타는 만큼 표정이 바뀌어요</Text>
            <Text className="text-small text-text-secondary">월간 기준</Text>
          </View>
          <View className="mt-3.5 flex-row gap-1.5">
            {MOOD_LEVELS.map((level) => (
              <View
                key={level.key}
                className={cn("flex-1 items-center gap-1 rounded-md py-2.5", level.key === mood.key ? "bg-bg" : "")}
              >
                <MoodFace mood={level.key} size={44} />
                <Text className="text-body-sm font-sans-bold">{level.label}</Text>
                <Text className="text-caption text-text-secondary">
                  {level.range}
                  {level.key === mood.key ? " · 나" : ""}
                </Text>
              </View>
            ))}
          </View>
        </View>
          </>
        )}
      </ScrollView>

      <InviteSheet visible={inviteOpen} onClose={() => setInviteOpen(false)} />
    </Screen>
  );
}
