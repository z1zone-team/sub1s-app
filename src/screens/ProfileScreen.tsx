import React from "react";
import { Pressable, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useUpdateProfileMutation } from "@/apis/mutations/users/useUpdateProfileMutation";
import { useFriendsQuery } from "@/apis/queries/users/useFriends";
import { useGetMe } from "@/apis/queries/auth/useGetMe";
import { useTravelStatsQuery } from "@/apis/queries/profile/useTravelStatsQuery";
import { useRankingQuery } from "@/apis/queries/ranking/useRankingQuery";
import { Button } from "@/common/components/Button";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { formatDistanceKm } from "@/common/utils/format";
import {
  percentileText,
  sumDistanceKm,
  VISIBILITY_OPTIONS,
  weekBars,
} from "@/features/profile/profileView";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { cn } from "@/lib/cn";

function Row({ label, value, onPress }: { label: string; value?: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="h-row flex-row items-center justify-between border-b border-border"
    >
      <Text className="text-subtitle">{label}</Text>
      <Text className="text-body text-text-secondary">{value ? `${value}  >` : ">"}</Text>
    </Pressable>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isSignedIn, signOut } = useAuth();
  const me = useGetMe();
  const all = useTravelStatsQuery("ALL");
  const week = useTravelStatsQuery("WEEK");
  const ranking = useRankingQuery({ periodType: "ALL", periodKey: "ALL", limit: 1 });
  const updateProfile = useUpdateProfileMutation();
  const friends = useFriendsQuery();

  if (!isSignedIn) {
    return (
      <Screen contentClassName="justify-center gap-4 px-6">
        <Text className="text-title-lg font-sans-extrabold">로그인이 필요해요</Text>
        <Text className="text-body text-text-secondary">
          로그인하면 이동 기록과 랭킹, 나에게 맞는 경로 추천을 쓸 수 있어요
        </Text>
        <Button label="로그인" onPress={() => navigation.navigate("Login")} />
      </Screen>
    );
  }

  const profile = me.data;
  const bars = weekBars(week.data?.buckets);
  const percentile = percentileText(ranking.data?.myPercentile);
  const visibility = profile?.rankingVisibility ?? "PUBLIC";

  return (
    <Screen scroll contentClassName="gap-5 px-5">
      <View className="gap-1 pt-4">
        <Text className="text-headline-md font-sans-extrabold">{profile?.name || profile?.nickname || ""}</Text>
        {profile ? <Text className="text-body text-text-secondary">@{profile.nickname}</Text> : null}
        {percentile ? <Text className="text-body-sm font-sans-bold text-primary">{percentile}</Text> : null}
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate("ProfileEdit")}>
          <Text className="mt-1 text-body-sm text-text-secondary">프로필 수정</Text>
        </Pressable>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1 gap-1 rounded-lg bg-surface p-4">
          <Text className="text-small text-text-secondary">총 이동 거리</Text>
          <Text className="text-title-lg font-sans-extrabold">{formatDistanceKm(all.data?.totalDistanceKm ?? 0)}</Text>
        </View>
        <View className="flex-1 gap-1 rounded-lg bg-surface p-4">
          <Text className="text-small text-text-secondary">환승</Text>
          <Text className="text-title-lg font-sans-extrabold">{all.data?.transferCount ?? 0}회</Text>
        </View>
      </View>

      <View className="gap-3">
        <View className="flex-row items-baseline justify-between">
          <Text className="text-subtitle font-sans-bold">
            이번 주 {formatDistanceKm(sumDistanceKm(week.data?.buckets))}
          </Text>
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate("Timeline")}>
            <Text className="text-body-sm text-primary">타임라인 자세히 보기</Text>
          </Pressable>
        </View>
        <View className="h-24 flex-row items-end gap-2">
          {bars.map((bar) => (
            <View key={bar.key} className="flex-1 items-center gap-1.5">
              <View
                className={cn("w-full rounded-xs", bar.ratio > 0 ? "bg-primary" : "bg-border")}
                style={{ height: Math.max(4, Math.round(bar.ratio * 72)) }}
              />
              <Text className="text-caption text-text-secondary">{bar.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-subtitle font-sans-bold">이동 기록 공개</Text>
        <View className="flex-row gap-2">
          {VISIBILITY_OPTIONS.map((option) => {
            const selected = option.value === visibility;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                disabled={updateProfile.isPending}
                onPress={() => {
                  if (!selected) updateProfile.mutate({ rankingVisibility: option.value });
                }}
                className={cn("h-control flex-1 items-center justify-center rounded-pill border", selected ? "border-primary bg-primary-tint" : "border-border bg-bg")}
              >
                <Text className={cn("text-body font-sans-bold", selected ? "text-primary" : "text-text")}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text className="text-small text-text-secondary">
          {VISIBILITY_OPTIONS.find((option) => option.value === visibility)?.description}
        </Text>
        {updateProfile.error ? (
          <Text className="text-small text-error">변경하지 못했어요. 다시 시도해 주세요.</Text>
        ) : null}
      </View>

      <View>
        <Row
          label="친구 관리"
          value={friends.data ? `${friends.data.totalCount}명` : undefined}
          onPress={() => navigation.navigate("Friends")}
        />
        <Row label="알림 설정" onPress={() => navigation.navigate("NotificationSettings")} />
        <Row label="관심 설문 다시 고치기" onPress={() => navigation.navigate("Onboarding", { editing: true })} />
        <Row label="이동 기록 타임라인" onPress={() => navigation.navigate("Timeline")} />
      </View>

      <Button label="로그아웃" variant="ghost" onPress={() => void signOut()} />
    </Screen>
  );
}
