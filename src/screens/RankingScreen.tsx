import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTravelStatsQuery } from "@/apis/queries/profile/useTravelStatsQuery";
import { useRankingQuery } from "@/apis/queries/ranking/useRankingQuery";
import { Button } from "@/common/components/Button";
import { Chip } from "@/common/components/Chip";
import { Screen } from "@/common/components/Screen";
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
import { useTheme } from "@/theme";

export function RankingScreen() {
  const { colors } = useTheme();
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
    return (
      <Screen contentStyle={{ paddingHorizontal: 24, justifyContent: "center", gap: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>로그인이 필요해요</Text>
        <Text style={{ color: colors.textSecondary }}>로그인하면 랭킹을 보고 친구와 겨룰 수 있어요</Text>
        <Button label="로그인" onPress={() => navigation.navigate("Login")} />
      </Screen>
    );
  }

  const data = ranking.data;
  const top = podium(data);
  const rows = rowsAfterPodium(data);
  const mood = moodOf(monthStats.data?.totalDistanceKm ?? 0);
  const order = [2, 1, 3];

  return (
    <Screen scroll contentStyle={{ paddingHorizontal: 20, gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 16 }}>
        {SCOPES.map((item) => (
          <Chip key={item.value} label={item.label} selected={item.value === scope} onPress={() => setScope(item.value)} />
        ))}
        <View style={{ flex: 1 }} />
        <Chip label="친구만 보기" selected={friendsOnly} onPress={() => setFriendsOnly((value) => !value)} />
      </View>

      <Text style={{ fontSize: 13, color: colors.textSecondary }}>
        {captionText(scope, month, friendsOnly, data?.totalUsers)}
      </Text>

      {ranking.error ? (
        <Text style={{ color: colors.error }}>랭킹을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</Text>
      ) : null}

      {top.length > 0 ? (
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
          {order.map((rank) => {
            const entry = top.find((item) => item.rank === rank);
            if (!entry) return <View key={rank} style={{ flex: 1 }} />;
            return (
              <View key={rank} style={{ flex: 1, alignItems: "center", gap: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: entry.isMe ? "800" : "600", color: colors.text }} numberOfLines={1}>
                  {entry.name}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{entry.km}</Text>
                <View
                  style={{
                    width: "100%",
                    height: rank === 1 ? 76 : rank === 2 ? 56 : 44,
                    alignItems: "center",
                    justifyContent: "center",
                    borderTopLeftRadius: 12,
                    borderTopRightRadius: 12,
                    backgroundColor: entry.isMe ? colors.primaryTint : colors.surface,
                    borderWidth: 1,
                    borderBottomWidth: 0,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>{rank}</Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : !ranking.isLoading ? (
        <Text style={{ paddingVertical: 24, textAlign: "center", color: colors.textSecondary }}>
          아직 랭킹에 오른 사람이 없어요
        </Text>
      ) : null}

      <View>
        {rows.map((row, index) =>
          row.kind === "GAP" ? (
            <Text key={`gap-${index}`} style={{ textAlign: "center", paddingVertical: 6, color: colors.textSecondary }}>
              ···
            </Text>
          ) : (
            <View
              key={`${row.rank}-${index}`}
              style={{
                height: 48,
                paddingHorizontal: 12,
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 10,
                backgroundColor: row.isMe ? colors.primaryTint : "transparent",
              }}
            >
              <Text style={{ width: 40, fontSize: 14, color: row.isMe ? colors.text : colors.textSecondary }}>
                {row.rank}
              </Text>
              <Text style={{ flex: 1, fontSize: 15, fontWeight: row.isMe ? "800" : "500", color: colors.text }}>
                {row.nickname}
                {row.isMe ? "  나" : ""}
              </Text>
              <Text style={{ fontSize: 14, color: colors.text }}>{row.value}</Text>
            </View>
          )
        )}
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
          타는 만큼 표정이 바뀌어요 · 이번 달 기준
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {MOOD_LEVELS.map((level) => (
            <View
              key={level.key}
              style={{
                flex: 1,
                alignItems: "center",
                gap: 4,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: colors.surface,
                borderWidth: level.key === mood.key ? 2 : 0,
                borderColor: colors.primary,
              }}
            >
              <Text style={{ fontSize: 24 }}>{level.face}</Text>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>{level.label}</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>
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
        style={{ padding: 16, gap: 2, borderRadius: 16, backgroundColor: colors.surface, marginBottom: 16 }}
      >
        <Text style={{ fontSize: 15, fontWeight: "800", color: colors.text }}>친구 초대하기</Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>
          링크로 들어온 친구와 서로 랭킹을 볼 수 있어요
        </Text>
      </Pressable>
    </Screen>
  );
}
