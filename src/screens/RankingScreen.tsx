import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTravelStatsQuery } from "@/apis/queries/profile/useTravelStatsQuery";
import { useRankingQuery } from "@/apis/queries/ranking/useRankingQuery";
import { LoginRequired } from "@/common/components/LoginRequired";
import { Chip } from "@/common/components/Chip";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
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
import type { RootStackParamList } from "@/navigation/navigation-types";
import { cn } from "@/lib/cn";

const PODIUM_HEIGHT: Record<number, string> = { 1: "h-19", 2: "h-14", 3: "h-11" };

export function RankingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isSignedIn } = useAuth();
  const [scope, setScope] = useState<RankingScope>("MONTHLY");
  const [friendsOnly, setFriendsOnly] = useState(false);
  const { year, month } = kstYearMonth(Date.now());

  const ranking = useRankingQuery({
    periodType: scope,
    periodKey: periodKeyOf(scope, year, month),
    friendsOnly,
    limit: 20,
  });
  const monthStats = useTravelStatsQuery("MONTH");

  if (!isSignedIn) {
    return <LoginRequired description="로그인하면 랭킹을 보고 친구와 겨룰 수 있어요" />;
  }

  const data = ranking.data;
  const top = podium(data);
  const rows = rowsAfterPodium(data);
  const mood = moodOf(monthStats.data?.totalDistanceKm ?? 0);
  const order = [2, 1, 3];

  return (
    <Screen scroll contentClassName="gap-4 px-5">
      <View className="flex-row items-center gap-2 pt-4">
        {SCOPES.map((item) => (
          <Chip key={item.value} label={item.label} selected={item.value === scope} onPress={() => setScope(item.value)} />
        ))}
        <View className="flex-1" />
        <Chip label="친구만 보기" selected={friendsOnly} onPress={() => setFriendsOnly((value) => !value)} />
      </View>

      <Text className="text-body-sm text-text-secondary">
        {captionText(scope, month, friendsOnly, data?.totalUsers)}
      </Text>

      {ranking.error ? (
        <Text className="text-error">랭킹을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</Text>
      ) : null}

      {top.length > 0 ? (
        <View className="flex-row items-end gap-2">
          {order.map((rank) => {
            const entry = top.find((item) => item.rank === rank);
            if (!entry) return <View key={rank} className="flex-1" />;
            return (
              <View key={rank} className="flex-1 items-center gap-1">
                <Text
                  className={cn("text-body-sm", entry.isMe ? "font-sans-extrabold" : "font-sans-semibold")}
                  numberOfLines={1}
                >
                  {entry.name}
                </Text>
                <Text className="text-small text-text-secondary">{entry.km}</Text>
                <View
                  className={cn("w-full items-center justify-center rounded-t-md border border-b-0 border-border", PODIUM_HEIGHT[rank], entry.isMe ? "bg-primary-tint" : "bg-surface")}
                >
                  <Text className="text-title-lg font-sans-extrabold">{rank}</Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : !ranking.isLoading ? (
        <Text className="py-6 text-center text-text-secondary">아직 랭킹에 오른 사람이 없어요</Text>
      ) : null}

      <View>
        {rows.map((row, index) =>
          row.kind === "GAP" ? (
            <Text key={`gap-${index}`} className="py-1.5 text-center text-text-secondary">
              ···
            </Text>
          ) : (
            <View
              key={`${row.rank}-${index}`}
              className={cn("h-row flex-row items-center rounded-sm-plus px-3", row.isMe ? "bg-primary-tint" : "")}
            >
              <Text className={cn("w-10 text-body", row.isMe ? "" : "text-text-secondary")}>{row.rank}</Text>
              <Text className={cn("flex-1 text-subtitle", row.isMe ? "font-sans-extrabold" : "font-sans-medium")}>
                {row.nickname}
                {row.isMe ? "  나" : ""}
              </Text>
              <Text className="text-body">{row.value}</Text>
            </View>
          )
        )}
      </View>

      <View className="gap-2">
        <Text className="text-body-sm font-sans-bold">타는 만큼 표정이 바뀌어요 · 이번 달 기준</Text>
        <View className="flex-row gap-2">
          {MOOD_LEVELS.map((level) => (
            <View
              key={level.key}
              className={cn("flex-1 items-center gap-1 rounded-md bg-surface py-2.5", level.key === mood.key ? "border-2 border-primary" : "")}
            >
              <Text className="text-headline-md">{level.face}</Text>
              <Text className="text-body-sm font-sans-bold">{level.label}</Text>
              <Text className="text-caption text-text-secondary">
                {level.range}
                {level.key === mood.key ? " · 나" : ""}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate("Friends")}
        className="mb-4 gap-0.5 rounded-lg bg-surface p-4"
      >
        <Text className="text-subtitle font-sans-extrabold">친구 초대하기</Text>
        <Text className="text-body-sm text-text-secondary">링크로 들어온 친구와 서로 랭킹을 볼 수 있어요</Text>
      </Pressable>
    </Screen>
  );
}
