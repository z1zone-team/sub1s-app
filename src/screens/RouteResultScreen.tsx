import React, { useMemo } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ApiError } from "@/apis/client";
import { useAuth } from "@clerk/clerk-expo";
import { usePreferencesQuery } from "@/apis/queries/users/usePreferencesQuery";
import { useRouteSearchQuery } from "@/apis/queries/routing/useRouteSearchQuery";
import { useStationsQuery } from "@/apis/queries/stations/useStationsQuery";
import { Button } from "@/common/components/Button";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { toRouteSearchRequest, type RouteEndpoint } from "@/features/routing/endpoint";
import { RouteCard } from "@/features/routing/components/RouteCard";
import { groupRouteOptions } from "@/features/routing/routeView";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { useTheme } from "@/theme";

/** 딥링크로 들어오면 이름이 비어 있어 역 조회로 채운다 */
function useEndpointNames(origin: RouteEndpoint, destination: RouteEndpoint) {
  const missing = [origin, destination]
    .filter((endpoint) => !endpoint.name && endpoint.stationId)
    .map((endpoint) => endpoint.stationId as string);
  const stations = useStationsQuery(missing);
  const nameOf = (endpoint: RouteEndpoint): string =>
    endpoint.name ||
    stations.data?.items.find((item) => item.stationId === endpoint.stationId)?.name ||
    "";
  return { originName: nameOf(origin), destinationName: nameOf(destination) };
}

function errorMessage(error: Error): string {
  if (error instanceof ApiError) {
    if (error.code === "ROUTE_NOT_FOUND") return "두 곳을 잇는 경로를 찾지 못했어요.";
    if (error.code === "STATION_NOT_FOUND") return "근처에 이용할 수 있는 지하철역이 없어요.";
    if (error.status === 400) return "출발지와 도착지를 다시 확인해 주세요.";
  }
  return "경로를 불러오지 못했어요.";
}

export function RouteResultScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "RouteResult">) {
  const { colors } = useTheme();
  const { origin, destination, mode } = route.params;

  const search = useRouteSearchQuery(toRouteSearchRequest(origin, destination, mode));
  const { originName, destinationName } = useEndpointNames(origin, destination);
  const { isSignedIn } = useAuth();
  const routePrefs = usePreferencesQuery(!!isSignedIn).data?.routePrefs;
  const groups = useMemo(
    () => groupRouteOptions(search.data?.options ?? [], routePrefs),
    [search.data, routePrefs]
  );

  return (
    <Screen edges={[]}>
      <View className="gap-0.5 px-5 py-3">
        <Text className="text-title font-sans-extrabold">
          {originName || "출발지"} → {destinationName || "도착지"}
        </Text>
        <Text className="text-small text-text-secondary">요금은 교통카드 기준이에요</Text>
      </View>

      {search.isLoading ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator color={colors.primary} />
          <Text className="text-text-secondary">경로를 찾는 중이에요</Text>
        </View>
      ) : search.error ? (
        <View className="flex-1 items-center justify-center gap-4 p-6">
          <Text className="text-center">{errorMessage(search.error)}</Text>
          <Button label="다시 시도" variant="secondary" onPress={() => void search.refetch()} />
          <Button label="다시 검색" variant="ghost" onPress={() => navigation.navigate("Search")} />
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(group) => group.option.mode + group.option.totalDurationSec}
          renderItem={({ item }) => (
            <RouteCard
              group={item}
              onPress={() =>
                navigation.navigate("RouteDetail", {
                  origin,
                  destination,
                  option: item.option,
                  title: item.title,
                  tagline: item.tagline,
                })
              }
            />
          )}
          ListEmptyComponent={
            <Text className="p-6 text-center text-text-secondary">보여 줄 경로가 없어요</Text>
          }
          contentContainerClassName="pb-6"
        />
      )}
    </Screen>
  );
}
