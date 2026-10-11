import React from "react";
import { Pressable, Text, View } from "react-native";
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
import { formatDistanceKm } from "@/common/utils/format";
import {
  percentileText,
  sumDistanceKm,
  VISIBILITY_OPTIONS,
  weekBars,
} from "@/features/profile/profileView";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { useTheme } from "@/theme";

function Row({ label, value, onPress }: { label: string; value?: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        height: 52,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text style={{ fontSize: 15, color: colors.text }}>{label}</Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary }}>{value ? `${value}  >` : ">"}</Text>
    </Pressable>
  );
}

export function ProfileScreen() {
  const { colors } = useTheme();
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
      <Screen contentStyle={{ paddingHorizontal: 24, justifyContent: "center", gap: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>로그인이 필요해요</Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary }}>
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
    <Screen scroll contentStyle={{ paddingHorizontal: 20, gap: 20 }}>
      <View style={{ gap: 4, paddingTop: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text }}>
          {profile?.name || profile?.nickname || ""}
        </Text>
        {profile ? (
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>@{profile.nickname}</Text>
        ) : null}
        {percentile ? (
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary }}>{percentile}</Text>
        ) : null}
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate("ProfileEdit")}>
          <Text style={{ marginTop: 4, fontSize: 13, color: colors.textSecondary }}>프로필 수정</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1, padding: 16, gap: 4, borderRadius: 16, backgroundColor: colors.surface }}>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>총 이동 거리</Text>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>
            {formatDistanceKm(all.data?.totalDistanceKm ?? 0)}
          </Text>
        </View>
        <View style={{ flex: 1, padding: 16, gap: 4, borderRadius: 16, backgroundColor: colors.surface }}>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>환승</Text>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>
            {all.data?.transferCount ?? 0}회
          </Text>
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
            이번 주 {formatDistanceKm(sumDistanceKm(week.data?.buckets))}
          </Text>
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate("Timeline")}>
            <Text style={{ fontSize: 13, color: colors.primary }}>타임라인 자세히 보기</Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, height: 96 }}>
          {bars.map((bar) => (
            <View key={bar.key} style={{ flex: 1, alignItems: "center", gap: 6 }}>
              <View
                style={{
                  width: "100%",
                  height: Math.max(4, Math.round(bar.ratio * 72)),
                  borderRadius: 4,
                  backgroundColor: bar.ratio > 0 ? colors.primary : colors.border,
                }}
              />
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>{bar.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>이동 기록 공개</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
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
                style={{
                  flex: 1,
                  height: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primaryTint : colors.bg,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "700", color: selected ? colors.primary : colors.text }}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={{ fontSize: 12, color: colors.textSecondary }}>
          {VISIBILITY_OPTIONS.find((option) => option.value === visibility)?.description}
        </Text>
        {updateProfile.error ? (
          <Text style={{ fontSize: 12, color: colors.error }}>변경하지 못했어요. 다시 시도해 주세요.</Text>
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
