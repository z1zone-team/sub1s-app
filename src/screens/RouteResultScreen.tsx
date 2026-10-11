import React, { useMemo } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ApiError } from "@/apis/client";
import { useRouteSearchQuery } from "@/apis/queries/routing/useRouteSearchQuery";
import { useStationsQuery } from "@/apis/queries/stations/useStationsQuery";
import { Button } from "@/common/components/Button";
import { Screen } from "@/common/components/Screen";
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
  const groups = useMemo(() => groupRouteOptions(search.data?.options ?? []), [search.data]);

  return (
    <Screen edges={[]}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 12, gap: 2 }}>
        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>
          {originName || "출발지"} → {destinationName || "도착지"}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary }}>
          요금은 교통카드 기준이에요
        </Text>
      </View>

      {search.isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ color: colors.textSecondary }}>경로를 찾는 중이에요</Text>
        </View>
      ) : search.error ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
          <Text style={{ textAlign: "center", color: colors.text }}>{errorMessage(search.error)}</Text>
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
            <Text style={{ padding: 24, textAlign: "center", color: colors.textSecondary }}>
              보여 줄 경로가 없어요
            </Text>
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </Screen>
  );
}
