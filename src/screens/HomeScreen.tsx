import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAppearanceStore } from "@/common/settings/appearance-store";
import { Alert, Pressable, ScrollView, View, type LayoutChangeEvent } from "react-native";
import { useAuth } from "@clerk/expo";
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useRemovePlaceMutation,
  useUserPlacesQuery,
} from "@/apis/queries/users/useUserPlaces";
import {
  useFavoriteRoutesQuery,
  useRemoveFavoriteRouteMutation,
} from "@/apis/queries/users/useFavoriteRoutes";
import {
  useFavoritePlacesQuery,
  useRemoveFavoritePlaceMutation,
  useSaveFavoritePlaceMutation,
} from "@/apis/queries/users/useFavoritePlaces";
import { ApiError } from "@/apis/client";
import { findFavoritePlace, toPlaceBody, toPlaceChips } from "@/features/routing/favoritePlaces";
import type { PlaceKind } from "@/apis/queries/users/places";
import { Chip } from "@/common/components/Chip";
import { BrandLogo } from "@/common/components/BrandLogo";
import { DesignIcon, type DesignIconName } from "@/common/components/DesignIcon";
import { Icon } from "@/common/components/Icon";
import { LineBadgeList } from "@/common/components/LineBadgeList";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { cn } from "@/lib/cn";
import { formatMonthDayKst } from "@/common/utils/format";
import { GuideBubble } from "@/features/home/GuideBubble";
import { HOME_SHEET_ROW_HEIGHT, HomeSheet, SHEET_PEEK_HEIGHT } from "@/features/home/HomeSheet";
import { FavoriteRoutesSheet } from "@/features/home/FavoriteRoutesSheet";
import { favoriteEndpoint, toHomeRouteChips } from "@/features/routing/favoriteRoutes";
import { useRecentDestinations } from "@/features/routing/useRecentDestinations";
import { PLACE_KINDS, PLACE_LABEL, placeOfKind, placeToEndpoint } from "@/features/places/placeEndpoint";
import { useActiveGuideStore } from "@/features/guide/active-guide-store";
import { minutesLabel } from "@/features/guide/guideText";
import { useStationsQuery } from "@/apis/queries/stations/useStationsQuery";
import { PlaceCard } from "@/features/search/components/PlaceCard";
import { useSelectedPlaceStore } from "@/features/search/selected-place-store";
import { VWorldMap } from "@/features/map/VWorldMap";
import { modeButtonAccessibilityLabel, modeButtonLabel, nextMapMode } from "@/features/map/mapStyle";
import { PickStatusCard } from "@/features/map/components/PickStatusCard";
import { pickErrorMessage } from "@/features/map/pickMessage";
import { useReversePlaceMutation } from "@/apis/queries/places/useReversePlaceMutation";
import { toPlaceRow } from "@/features/routing/searchRows";
import { useHomeMapData } from "@/features/map/useHomeMapData";
import { useOnboardingPrompt } from "@/features/onboarding/useOnboardingPrompt";
import type { BottomTabParamList, RootStackParamList } from "@/navigation/navigation-types";

const PLACE_ICON: Record<PlaceKind, DesignIconName> = { HOME: "home", SCHOOL: "school" };
/** 지도 검색에서 장소를 고르면 시트 대신 보이는 하단 카드의 대략적인 높이. 안내 복귀 버튼이 그 위에 놓인다 */
const PLACE_CARD_HEIGHT = 200;

/** 상태 표시줄 아래로 검색 필, 칩 줄, 플로팅 버튼이 내려오는 간격(px). 프로토타입의 58 / 120 / 176에서 상태 표시줄 높이를 뺀 값 */
const SEARCH_OFFSET = 10;
const CHIPS_OFFSET = 62;
const FAB_OFFSET = 118;
/** 안내 복귀 버튼을 끌어 올릴 수 있는 가장 위(상태 표시줄 아래로부터). 프로토타입의 176에서 상태 표시줄 높이 58을 뺀 값 */
const BUBBLE_TOP_OFFSET = 118;

function FloatingButton({
  label,
  onPress,
  selected = false,
  children,
}: {
  label: string;
  onPress: () => void;
  selected?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      className={cn(
        "h-control w-11 items-center justify-center rounded-pill border",
        selected ? "border-primary bg-primary" : "border-border bg-bg"
      )}
    >
      {children}
    </Pressable>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<BottomTabParamList, "HomeTab">>();
  const insets = useSafeAreaInsets();
  useOnboardingPrompt();
  const recent = useRecentDestinations();
  const selectedPlace = useSelectedPlaceStore((state) => state.place);
  const clearSelectedPlace = useSelectedPlaceStore((state) => state.clear);
  const selectPlace = useSelectedPlaceStore((state) => state.select);
  // 지도를 길게 눌러 고른 좌표. 주소를 받는 동안 핀을 보여 주고, 받으면 선택한 장소로 바뀐다
  const [pick, setPick] = useState<{ lat: number; lng: number } | null>(null);
  const reverse = useReversePlaceMutation();
  // 최근 검색에서 고른 역은 좌표가 없어서 서버에서 받아 온다
  const needsStationCoords = Boolean(selectedPlace && !selectedPlace.coords && selectedPlace.endpoint.stationId);
  const pinStation = useStationsQuery(
    needsStationCoords && selectedPlace?.endpoint.stationId ? [selectedPlace.endpoint.stationId] : []
  );
  const pinCoords =
    selectedPlace?.coords ??
    pick ??
    (needsStationCoords ? pinStation.data?.items.find((item) => item.stationId === selectedPlace?.endpoint.stationId) : undefined);
  const baseMapData = useHomeMapData(pinCoords ? { lat: pinCoords.lat, lng: pinCoords.lng } : undefined);
  const closePick = () => {
    reverse.reset();
    setPick(null);
  };
  const onMapLongPress = (point: { lat: number; lng: number }) => {
    clearSelectedPlace();
    setPick(point);
    reverse.mutate(point, {
      onSuccess: (item) => {
        selectPlace(toPlaceRow(item));
        setPick(null);
      },
    });
  };
  const { isSignedIn } = useAuth();
  const places = useUserPlacesQuery();
  const removePlace = useRemovePlaceMutation();
  const favoriteRoutes = useFavoriteRoutesQuery();
  const removeFavoriteRoute = useRemoveFavoriteRouteMutation();
  const favoritePlaces = useFavoritePlacesQuery();
  const saveFavoritePlace = useSaveFavoritePlaceMutation();
  const removeFavoritePlace = useRemoveFavoritePlaceMutation();
  const placeChips = useMemo(() => toPlaceChips(favoritePlaces.data?.places), [favoritePlaces.data]);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const activeGuide = useActiveGuideStore((state) => state.guide);
  const [areaHeight, setAreaHeight] = useState(0);
  const [areaWidth, setAreaWidth] = useState(0);
  const mapMode = useAppearanceStore((state) => state.mapMode);
  const setMapMode = useAppearanceStore((state) => state.setMapMode);
  const [recenterCount, setRecenterCount] = useState(0);

  // 안내에서 돌아오면 선택한 장소 대신 현재 위치를 중심으로 다시 맞춘다.
  const recenterRequest = route.params?.recenterRequest;
  useEffect(() => {
    if (recenterRequest === undefined) return;
    clearSelectedPlace();
    setRecenterCount((count) => count + 1);
  }, [recenterRequest, clearSelectedPlace]);

  // 현재 위치 버튼을 누르면 같은 좌표라도 지도를 다시 맞추도록 새 객체를 만든다
  const mapData = useMemo(
    () => (recenterCount > 0 ? { ...baseMapData } : baseMapData),
    [baseMapData, recenterCount]
  );
  const hasLocation = baseMapData.markers.some((marker) => marker.kind === "me");

  const routeChips = useMemo(
    () => toHomeRouteChips(favoriteRoutes.data?.favorites, recent.routes),
    [favoriteRoutes.data, recent.routes]
  );

  const openPlace = (kind: PlaceKind) => {
    const place = placeOfKind(places.data, kind);
    if (place) navigation.navigate("Search", { destination: placeToEndpoint(place) });
    else navigation.navigate("Search", { pickPlace: kind });
  };

  const editPlace = (kind: PlaceKind) => {
    Alert.alert(`${PLACE_LABEL[kind]} 변경`, "저장한 장소를 어떻게 할까요?", [
      { text: "다시 지정", onPress: () => navigation.navigate("Search", { pickPlace: kind }) },
      { text: "삭제", style: "destructive", onPress: () => removePlace.mutate(kind) },
      { text: "취소", style: "cancel" },
    ]);
  };

  // 검색 화면에서 돌아오면 방금 검색한 도착지가 보이도록 다시 읽는다
  const { reload } = recent;
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  const onLayout = (event: LayoutChangeEvent) => {
    setAreaHeight(event.nativeEvent.layout.height);
    setAreaWidth(event.nativeEvent.layout.width);
  };
  const searchTop = insets.top + SEARCH_OFFSET;

  return (
    // 지도가 상태 표시줄 뒤까지 채우도록 안전 영역을 Screen이 아니라 각 요소가 직접 처리한다
    <Screen edges={[]}>
      <View onLayout={onLayout} className="flex-1 bg-surface">
        <VWorldMap data={mapData} className="flex-1" onLongPress={onMapLongPress} />

        <View style={{ top: searchTop }} className="absolute inset-x-4 flex-row items-center gap-2">
          <View className="h-control-lg flex-1 flex-row items-center gap-1 rounded-pill border border-border bg-bg pl-2 pr-1.5">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="어디로 갈까요?"
              onPress={() => navigation.navigate("MapSearch")}
              className="h-control flex-1 flex-row items-center gap-2.5"
            >
              <BrandLogo size={34} radius={9} />
              <Text className="text-base font-sans-medium text-text-secondary">어디로 갈까요?</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="음성 검색"
              onPress={() => navigation.navigate("Voice")}
              className="h-11 w-11 items-center justify-center rounded-pill"
            >
              <DesignIcon name="mic" size={22} />
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="길찾기"
            onPress={() => navigation.navigate("Search")}
            className="h-control-lg w-13 items-center justify-center rounded-pill bg-primary"
          >
            <DesignIcon name="route" size={24} tone="onPrimary" />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={{ top: searchTop + CHIPS_OFFSET }}
          className="absolute inset-x-0 flex-grow-0"
          contentContainerClassName="gap-2 px-4"
        >
          {isSignedIn
            ? PLACE_KINDS.map((kind) => {
                const saved = placeOfKind(places.data, kind);
                return (
                  <Chip
                    key={kind}
                    compact
                    label={PLACE_LABEL[kind]}
                    leading={<DesignIcon name={PLACE_ICON[kind]} size={16} />}
                    onPress={() => openPlace(kind)}
                    onLongPress={saved ? () => editPlace(kind) : undefined}
                  />
                );
              })
            : null}
          {placeChips.map((chip) => (
            <Chip
              key={chip.id}
              compact
              label={chip.label}
              leading={<DesignIcon name="star" size={16} filled />}
              onPress={() => navigation.navigate("Search", { destination: chip.endpoint })}
              onLongPress={() =>
                Alert.alert(`${chip.label} 즐겨찾기`, "즐겨찾기에서 지울까요?", [
                  { text: "삭제", style: "destructive", onPress: () => removeFavoritePlace.mutate(chip.place.id) },
                  { text: "취소", style: "cancel" },
                ])
              }
            />
          ))}
          {routeChips.map((chip) => (
            <Chip
              key={chip.id}
              compact
              label={chip.label}
              leading={<DesignIcon name={chip.favorite ? "star" : "clock"} size={16} filled={chip.favorite} />}
              onPress={() => navigation.navigate("RouteResult", { origin: chip.origin, destination: chip.destination })}
            />
          ))}
        </ScrollView>

        <View style={{ top: searchTop + FAB_OFFSET }} className="absolute right-4 gap-2.5">
          <FloatingButton label={modeButtonAccessibilityLabel(mapMode)} onPress={() => void setMapMode(nextMapMode(mapMode))}>
            <Text className="text-body-sm font-sans-bold text-text">{modeButtonLabel(mapMode)}</Text>
          </FloatingButton>
          <FloatingButton label="즐겨찾기" onPress={() => setFavoritesOpen(true)}>
            <DesignIcon name="star" size={20} />
          </FloatingButton>
          <FloatingButton
            label="현재 위치"
            onPress={() => {
              if (hasLocation) setRecenterCount((count) => count + 1);
            }}
          >
            <DesignIcon name="locate" size={20} tone={hasLocation ? "text" : "disabled"} />
          </FloatingButton>
        </View>

        <FavoriteRoutesSheet
          visible={favoritesOpen}
          signedIn={!!isSignedIn}
          favorites={favoriteRoutes.data?.favorites}
          loading={favoriteRoutes.isLoading}
          limit={favoriteRoutes.data?.limit}
          onClose={() => setFavoritesOpen(false)}
          onSelect={(favorite) => {
            setFavoritesOpen(false);
            navigation.navigate("RouteResult", {
              origin: favoriteEndpoint(favorite.origin),
              destination: favoriteEndpoint(favorite.destination),
            });
          }}
          onRemove={(favorite) => removeFavoriteRoute.mutate(favorite.id)}
          places={favoritePlaces.data?.places}
          placeLimit={favoritePlaces.data?.limit}
          onSelectPlace={(place) => {
            setFavoritesOpen(false);
            navigation.navigate("Search", { destination: favoriteEndpoint(place) });
          }}
          onRemovePlace={(place) => removeFavoritePlace.mutate(place.id)}
          onLogin={() => {
            setFavoritesOpen(false);
            navigation.navigate("Login");
          }}
        />

        {activeGuide ? (
          <GuideBubble
            width={areaWidth}
            height={areaHeight}
            sheetTop={areaHeight - (selectedPlace ? PLACE_CARD_HEIGHT : SHEET_PEEK_HEIGHT)}
            topLimit={insets.top + BUBBLE_TOP_OFFSET}
            label={minutesLabel(activeGuide.remainingSec)}
            onPress={() =>
              navigation.navigate("LiveNav", {
                sessionId: activeGuide.sessionId,
                option: activeGuide.option,
                startedAtMs: activeGuide.startedAtMs,
                origin: activeGuide.origin,
                destination: activeGuide.destination,
              })
            }
            onEnd={() => useActiveGuideStore.getState().end()}
          />
        ) : null}

        {pick ? (
          <PickStatusCard errorMessage={reverse.isError ? pickErrorMessage(reverse.error) : undefined} onClose={closePick} />
        ) : selectedPlace ? (
          <PlaceCard
            place={selectedPlace}
            onClose={clearSelectedPlace}
            onOrigin={() => {
              navigation.navigate("Search", { origin: selectedPlace.endpoint });
              clearSelectedPlace();
            }}
            onDestination={() => {
              navigation.navigate("Search", { destination: selectedPlace.endpoint });
              clearSelectedPlace();
            }}
            favorite={{
              saved: Boolean(findFavoritePlace(favoritePlaces.data?.places, selectedPlace.endpoint)),
              pending: saveFavoritePlace.isPending || removeFavoritePlace.isPending,
              onToggle: () => {
                if (!isSignedIn) {
                  Alert.alert("로그인이 필요해요", "로그인하면 자주 가는 곳을 저장할 수 있어요.", [
                    { text: "로그인", onPress: () => navigation.navigate("Login") },
                    { text: "취소", style: "cancel" },
                  ]);
                  return;
                }
                const saved = findFavoritePlace(favoritePlaces.data?.places, selectedPlace.endpoint);
                if (saved) {
                  removeFavoritePlace.mutate(saved.id);
                  return;
                }
                const body = toPlaceBody(selectedPlace.endpoint);
                if (!body) {
                  Alert.alert("저장할 수 없는 곳이에요", "현재 위치는 즐겨찾기에 둘 수 없어요.");
                  return;
                }
                saveFavoritePlace.mutate(body, {
                  onError: (error) => {
                    if (error instanceof ApiError && error.code === "FAVORITE_PLACE_LIMIT") {
                      Alert.alert("더 저장할 수 없어요", "장소 즐겨찾기는 20곳까지 저장할 수 있어요. 홈의 ★ 목록에서 지워 주세요.");
                    } else {
                      Alert.alert("저장하지 못했어요", "잠시 후 다시 시도해 주세요.");
                    }
                  },
                });
              },
            }}
          />
        ) : (
          <HomeSheet
            containerHeight={areaHeight}
            topInset={insets.top}
            title="최근 도착지"
            actionLabel="전체보기"
            onActionPress={() => navigation.navigate("Search")}
          >
            {recent.destinations.length === 0 ? (
              <View style={{ height: HOME_SHEET_ROW_HEIGHT }} className="justify-center">
                <Text className="text-center text-text-secondary">아직 검색한 도착지가 없어요</Text>
              </View>
            ) : (
              recent.destinations.map((destination) => {
                const lineIds = destination.endpoint.stationId
                  ? recent.linesOfStation.get(destination.endpoint.stationId) ?? []
                  : [];
                return (
                  <Pressable
                    key={destination.routeIds[0]}
                    accessibilityRole="button"
                    onPress={() => navigation.navigate("Search", { destination: destination.endpoint })}
                    className="h-15 flex-row items-center gap-3.5"
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-md-plus bg-surface">
                      <DesignIcon name="clock" size={18} tone="secondary" />
                    </View>
                    <View className="flex-1 flex-row items-center gap-1.5">
                      <Text numberOfLines={1} className="shrink text-base font-sans-bold">
                        {destination.endpoint.name}
                      </Text>
                      <LineBadgeList lineIds={lineIds} />
                    </View>
                    <Text className="text-body-sm text-text-secondary">{formatMonthDayKst(destination.searchedAt)}</Text>
                  </Pressable>
                );
              })
            )}
          </HomeSheet>
        )}
      </View>
    </Screen>
  );
}
