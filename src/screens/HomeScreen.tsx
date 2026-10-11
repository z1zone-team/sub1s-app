import React, { useCallback } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LineBadge } from "@/common/components/LineBadge";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { formatMonthDayKst } from "@/common/utils/format";
import { useRecentDestinations } from "@/features/routing/useRecentDestinations";
import { VWorldMap } from "@/features/map/VWorldMap";
import { useHomeMapData } from "@/features/map/useHomeMapData";
import { useOnboardingPrompt } from "@/features/onboarding/useOnboardingPrompt";
import type { RootStackParamList } from "@/navigation/navigation-types";

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  useOnboardingPrompt();
  const recent = useRecentDestinations();
  const mapData = useHomeMapData(recent.destinations);

  // 검색 화면에서 돌아오면 방금 검색한 도착지가 보이도록 다시 읽는다
  const { reload } = recent;
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  return (
    <Screen>
      <View className="flex-1 bg-surface">
        <VWorldMap data={mapData} className="flex-1" />

        <View className="absolute left-4 right-4 top-3 h-control-lg flex-row items-center rounded-md border border-border bg-bg">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="역, 장소 검색"
            onPress={() => navigation.navigate("Search")}
            className="h-full flex-1 justify-center px-4"
          >
            <Text className="text-base text-text-disabled">역, 장소 검색</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="음성 검색"
            onPress={() => navigation.navigate("Voice")}
            className="h-full items-center justify-center px-4"
          >
            <Text className="text-body font-sans-bold text-primary">음성</Text>
          </Pressable>
        </View>
      </View>

      <View className="max-h-[50%] rounded-t-lg-plus border-t border-border bg-bg">
        <Text className="px-5 pb-2 pt-4 text-subtitle font-sans-bold">최근 도착지</Text>
        <ScrollView keyboardShouldPersistTaps="handled">
          {recent.destinations.length === 0 ? (
            <Text className="p-6 text-center text-text-secondary">아직 검색한 도착지가 없어요</Text>
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
                  className="flex-row items-center gap-2 border-b border-border px-5 py-3.5"
                >
                  <Text numberOfLines={1} className="shrink text-base font-sans-semibold">
                    {destination.endpoint.name}
                  </Text>
                  {lineIds.map((lineId) => (
                    <LineBadge key={lineId} lineId={lineId} size="sm" />
                  ))}
                  <Text className="ml-auto text-small text-text-secondary">
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
