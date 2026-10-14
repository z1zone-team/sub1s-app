import { ROUTE_PREFS } from "@/features/onboarding/options";
import React, { useMemo, useRef } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ApiError } from "@/apis/client";
import { useAuth } from "@clerk/expo";
import {
  useFavoriteRoutesQuery,
  useRemoveFavoriteRouteMutation,
  useSaveFavoriteRouteMutation,
} from "@/apis/queries/users/useFavoriteRoutes";
import { usePreferencesQuery } from "@/apis/queries/users/usePreferencesQuery";
import { useRouteSearchQuery } from "@/apis/queries/routing/useRouteSearchQuery";
import { useNextTrainsQuery } from "@/apis/queries/stations/useNextTrainsQuery";
import { useStationsQuery } from "@/apis/queries/stations/useStationsQuery";
import { Button } from "@/common/components/Button";
import { DesignIcon } from "@/common/components/DesignIcon";
import { RiseIn } from "@/common/components/RiseIn";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { toRouteSearchRequest, type RouteEndpoint } from "@/features/routing/endpoint";
import { canFavorite, findFavorite, toSaveBody } from "@/features/routing/favoriteRoutes";
import { RouteResultCard } from "@/features/routing/components/RouteResultCard";
import { departureLabel, endpointLabel, waitingText } from "@/features/routing/routeCardView";
import { groupRouteOptions, pickNextTrain } from "@/features/routing/routeView";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { useTheme, WALK_LINE_ID } from "@/theme";

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

/** 프로토타입 Route.dc.html의 경로 목록. 위에 출발 → 도착 박스, 출발 시각 줄, 그 아래 카드 목록 */
export function RouteResultScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "RouteResult">) {
  const { colors } = useTheme();
  const { origin, destination, mode } = route.params;
  const openedAt = useRef(Date.now()).current;

  const search = useRouteSearchQuery(toRouteSearchRequest(origin, destination, mode));
  const { originName, destinationName } = useEndpointNames(origin, destination);
  const { isSignedIn } = useAuth();
  const routePrefs = usePreferencesQuery(!!isSignedIn).data?.routePrefs;
  const groups = useMemo(
    () => groupRouteOptions(search.data?.options ?? [], routePrefs, search.data?.recommendation),
    [search.data, routePrefs]
  );

  const favoriteRoutes = useFavoriteRoutesQuery();
  const saveFavorite = useSaveFavoriteRouteMutation();
  const removeFavorite = useRemoveFavoriteRouteMutation();
  const favorite = findFavorite(favoriteRoutes.data?.favorites, origin, destination);
  const favoritePending = saveFavorite.isPending || removeFavorite.isPending;

  const toggleFavorite = () => {
    if (!isSignedIn) {
      Alert.alert("로그인이 필요해요", "로그인하면 자주 가는 경로를 저장할 수 있어요.", [
        { text: "로그인", onPress: () => navigation.navigate("Login") },
        { text: "취소", style: "cancel" },
      ]);
      return;
    }
    if (favorite) {
      removeFavorite.mutate(favorite.id);
      return;
    }
    const body = toSaveBody(origin, destination);
    if (!body) {
      Alert.alert("저장할 수 없는 경로예요", "현재 위치에서 출발하는 경로는 즐겨찾기에 둘 수 없어요.");
      return;
    }
    saveFavorite.mutate(body, {
      onError: (error) => {
        if (error instanceof ApiError && error.code === "FAVORITE_ROUTE_LIMIT") {
          Alert.alert("더 저장할 수 없어요", "즐겨찾기 경로는 20개까지 저장할 수 있어요. 홈의 ★ 목록에서 지워 주세요.");
        } else {
          Alert.alert("저장하지 못했어요", "잠시 후 다시 시도해 주세요.");
        }
      },
    });
  };

  // 맨 위 카드의 첫 탑승역에서 곧 오는 열차 ("2분 후 · 중앙보훈병원 방면")
  const firstRide = groups[0]?.option.segments.find((segment) => segment.lineId !== WALK_LINE_ID);
  const nextTrains = useNextTrainsQuery(
    { stationId: firstRide?.fromStationId ?? "", limit: 2 },
    { enabled: Boolean(firstRide) }
  );
  const boarding = useMemo(() => {
    if (!firstRide || !nextTrains.data) return undefined;
    const train = pickNextTrain(nextTrains.data.trains, firstRide);
    return train ? { waiting: waitingText(train.arrivalInSec), headsign: train.headsign } : undefined;
  }, [firstRide, nextTrains.data]);

  return (
    <Screen>
      <View className="px-4 pt-2.5">
        <View className="h-13 flex-row items-center gap-2 rounded-lg border border-border pl-4 pr-1.5">
          <View className="h-2.5 w-2.5 rounded-pill border-2.5 border-text" />
          <Text numberOfLines={1} className="shrink text-subtitle font-sans-bold">
            {endpointLabel({ ...origin, name: originName || "출발지" })}
          </Text>
          <DesignIcon name="arrow" size={16} tone="secondary" />
          <View className="h-2.5 w-2.5 rounded-pill bg-text" />
          <Text numberOfLines={1} className="flex-1 text-subtitle font-sans-bold">
            {endpointLabel({ ...destination, name: destinationName || "도착지" })}
          </Text>
          {canFavorite(origin, destination) || !isSignedIn ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={favorite ? "즐겨찾기에서 빼기" : "즐겨찾기에 추가"}
              accessibilityState={{ selected: Boolean(favorite), disabled: favoritePending }}
              disabled={favoritePending}
              onPress={toggleFavorite}
              className="h-10 w-10 items-center justify-center"
            >
              <DesignIcon name="star" size={20} filled={Boolean(favorite)} tone={favorite ? "primary" : "secondary"} />
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="닫기"
            onPress={() => navigation.navigate("Search")}
            className="h-10 w-10 items-center justify-center"
          >
            <DesignIcon name="close" size={20} />
          </Pressable>
        </View>
      </View>
      <View className="mt-2.5 h-11.5 flex-row items-center justify-between border-b border-border px-5">
        <Text className="text-body font-sans-bold text-accent">{departureLabel(openedAt)}</Text>
        <Text className="text-small font-sans-semibold text-text-secondary">요금은 교통카드 기준</Text>
      </View>

      {search.isLoading ? (
        <View className="flex-1 items-center justify-center gap-3 bg-surface">
          <ActivityIndicator color={colors.primary} />
          <Text className="text-text-secondary">경로를 찾는 중이에요</Text>
        </View>
      ) : search.error ? (
        <View className="flex-1 items-center justify-center gap-4 bg-surface p-6">
          <Text className="text-center">{errorMessage(search.error)}</Text>
          <Button label="다시 시도" variant="secondary" onPress={() => void search.refetch()} />
          <Button label="다시 검색" variant="ghost" onPress={() => navigation.navigate("Search")} />
        </View>
      ) : (
        <FlatList
          className="flex-1 bg-surface"
          data={groups}
          ListHeaderComponent={
            <View className="px-5 pt-3">
              {(search.data?.recommendation?.unsupportedPreferences?.length ?? 0) > 0 ? (
                <Text className="text-small text-text-secondary">
                  {`아직 반영하지 못한 선호: ${search.data?.recommendation?.unsupportedPreferences?.map((code) => ROUTE_PREFS.find((item) => item.code === code)?.label).filter(Boolean).join(" · ")}`}
                </Text>
              ) : null}
              {search.data?.options.some((option) => option.walkDistanceSource === "ESTIMATED") ? (
                <Text className="text-small text-text-secondary">도보거리는 추정값이에요.</Text>
              ) : null}
            </View>
          }
          keyExtractor={(group) => group.option.mode + group.option.totalDurationSec}
          renderItem={({ item, index }) => (
            <RiseIn>
              <RouteResultCard
                group={item}
                boarding={index === 0 ? boarding : undefined}
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
            </RiseIn>
          )}
          ListEmptyComponent={
            <Text className="p-6 text-center text-text-secondary">보여 줄 경로가 없어요</Text>
          }
          contentContainerClassName="gap-2.5 px-3 pb-10 pt-3"
        />
      )}
    </Screen>
  );
}
