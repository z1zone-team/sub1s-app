import React, { useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LineBadge } from "@/common/components/LineBadge";
import { Screen } from "@/common/components/Screen";
import { formatMonthDayKst } from "@/common/utils/format";
import { useRecentDestinations } from "@/features/routing/useRecentDestinations";
import { useOnboardingPrompt } from "@/features/onboarding/useOnboardingPrompt";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { useTheme } from "@/theme";

export function HomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  useOnboardingPrompt();
  const recent = useRecentDestinations();

  // 검색 화면에서 돌아오면 방금 검색한 도착지가 보이도록 다시 읽는다
  const { reload } = recent;
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>지도는 준비 중이에요</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="역, 장소 검색"
          onPress={() => navigation.navigate("Search")}
          style={{
            position: "absolute",
            top: 12,
            left: 16,
            right: 16,
            height: 52,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.bg,
            paddingHorizontal: 16,
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 16, color: colors.textDisabled }}>역, 장소 검색</Text>
        </Pressable>
      </View>

      <View
        style={{
          maxHeight: "50%",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          backgroundColor: colors.bg,
          borderTopWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 8,
            fontSize: 15,
            fontWeight: "700",
            color: colors.text,
          }}
        >
          최근 도착지
        </Text>
        <ScrollView keyboardShouldPersistTaps="handled">
          {recent.destinations.length === 0 ? (
            <Text style={{ padding: 24, textAlign: "center", color: colors.textSecondary }}>
              아직 검색한 도착지가 없어요
            </Text>
          ) : (
            recent.destinations.map((destination) => {
              const lineIds = destination.endpoint.stationId
                ? recent.linesOfStation.get(destination.endpoint.stationId) ?? []
                : [];
              return (
                <Pressable
                  key={destination.routeIds[0]}
                  accessibilityRole="button"
                  onPress={() =>
                    navigation.navigate("Search", { destination: destination.endpoint })
                  }
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{ flexShrink: 1, fontSize: 16, fontWeight: "600", color: colors.text }}
                  >
                    {destination.endpoint.name}
                  </Text>
                  {lineIds.map((lineId) => (
                    <LineBadge key={lineId} lineId={lineId} size="sm" />
                  ))}
                  <Text style={{ marginLeft: "auto", fontSize: 12, color: colors.textSecondary }}>
                    {formatMonthDayKst(destination.searchedAt)}
                  </Text>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}
