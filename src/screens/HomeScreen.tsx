import React, { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, View, type LayoutChangeEvent } from "react-native";
import { useAuth } from "@clerk/expo";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useRemovePlaceMutation,
  useUserPlacesQuery,
} from "@/apis/queries/users/useUserPlaces";
import type { PlaceKind } from "@/apis/queries/users/places";
import { Chip } from "@/common/components/Chip";
import { DesignIcon, type DesignIconName } from "@/common/components/DesignIcon";
import { Icon } from "@/common/components/Icon";
import { LineBadge } from "@/common/components/LineBadge";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { cn } from "@/lib/cn";
import { formatMonthDayKst } from "@/common/utils/format";
import { HomeSheet, SHEET_PEEK_HEIGHT } from "@/features/home/HomeSheet";
import { toRecentRouteChips } from "@/features/routing/recentDestinations";
import { useRecentDestinations } from "@/features/routing/useRecentDestinations";
import { PLACE_KINDS, PLACE_LABEL, placeOfKind, placeToEndpoint } from "@/features/places/placeEndpoint";
import { useActiveGuideStore } from "@/features/guide/active-guide-store";
import { minutesLabel } from "@/features/guide/guideText";
import { useStationsQuery } from "@/apis/queries/stations/useStationsQuery";
import { PlaceCard } from "@/features/search/components/PlaceCard";
import { useSelectedPlaceStore } from "@/features/search/selected-place-store";
import { VWorldMap } from "@/features/map/VWorldMap";
import { useHomeMapData } from "@/features/map/useHomeMapData";
import { useOnboardingPrompt } from "@/features/onboarding/useOnboardingPrompt";
import type { RootStackParamList } from "@/navigation/navigation-types";

const PLACE_ICON: Record<PlaceKind, DesignIconName> = { HOME: "home", SCHOOL: "school" };
const MAX_ROUTE_CHIPS = 2;
/** 지도 검색에서 장소를 고르면 시트 대신 보이는 하단 카드의 대략적인 높이. 안내 복귀 버튼이 그 위에 놓인다 */
const PLACE_CARD_HEIGHT = 200;

/** 상태 표시줄 아래로 검색 필, 칩 줄, 플로팅 버튼이 내려오는 간격(px). 프로토타입의 58 / 120 / 176에서 상태 표시줄 높이를 뺀 값 */
const SEARCH_OFFSET = 10;
const CHIPS_OFFSET = 62;
const FAB_OFFSET = 118;

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
  const insets = useSafeAreaInsets();
  useOnboardingPrompt();
  const recent = useRecentDestinations();
  const selectedPlace = useSelectedPlaceStore((state) => state.place);
  const clearSelectedPlace = useSelectedPlaceStore((state) => state.clear);
  // 최근 검색에서 고른 역은 좌표가 없어서 서버에서 받아 온다
  const needsStationCoords = Boolean(selectedPlace && !selectedPlace.coords && selectedPlace.endpoint.stationId);
  const pinStation = useStationsQuery(
    needsStationCoords && selectedPlace?.endpoint.stationId ? [selectedPlace.endpoint.stationId] : []
  );
  const pinCoords =
    selectedPlace?.coords ??
    (needsStationCoords ? pinStation.data?.items.find((item) => item.stationId === selectedPlace?.endpoint.stationId) : undefined);
  const baseMapData = useHomeMapData(pinCoords ? { lat: pinCoords.lat, lng: pinCoords.lng } : undefined);
  const { isSignedIn } = useAuth();
  const places = useUserPlacesQuery();
  const removePlace = useRemovePlaceMutation();
  const activeGuide = useActiveGuideStore((state) => state.guide);
  const [areaHeight, setAreaHeight] = useState(0);
  const [is3d, setIs3d] = useState(false);
  const [recenterCount, setRecenterCount] = useState(0);

  // 현재 위치 버튼을 누르면 같은 좌표라도 지도를 다시 맞추도록 새 객체를 만든다
  const mapData = useMemo(
    () => (recenterCount > 0 ? { ...baseMapData } : baseMapData),
    [baseMapData, recenterCount]
  );
  const hasLocation = baseMapData.markers.some((marker) => marker.kind === "me");

  const routeChips = useMemo(() => toRecentRouteChips(recent.routes, MAX_ROUTE_CHIPS), [recent.routes]);

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

  const onLayout = (event: LayoutChangeEvent) => setAreaHeight(event.nativeEvent.layout.height);
  const searchTop = insets.top + SEARCH_OFFSET;

  return (
    // 지도가 상태 표시줄 뒤까지 채우도록 안전 영역을 Screen이 아니라 각 요소가 직접 처리한다
    <Screen edges={[]}>
      <View onLayout={onLayout} className="flex-1 bg-surface">
        <VWorldMap data={mapData} className="flex-1" />

        <View style={{ top: searchTop }} className="absolute inset-x-4 flex-row items-center gap-2">
          <View className="h-control-lg flex-1 flex-row items-center gap-1 rounded-pill border border-border bg-bg pl-2 pr-1.5">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="역, 장소 검색"
              onPress={() => navigation.navigate("MapSearch")}
              className="h-control flex-1 flex-row items-center gap-2.5"
            >
              {/* 로고 에셋이 확정되기 전까지 자리만 잡는다 (TASKS 6-D 스플래시와 로고 에셋) */}
              <View className="h-8.5 w-8.5 items-center justify-center rounded-sm-mid bg-primary-tint">
                <Icon name="subway-outline" size={20} tone="primary" />
              </View>
              <Text className="text-base font-sans-medium text-text-secondary">역, 장소 검색</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="음성 검색"
              onPress={() => navigation.navigate("Voice")}
              className="h-10 w-10 items-center justify-center rounded-pill"
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
          {routeChips.map((chip) => (
            <Chip
              key={chip.id}
              compact
              label={chip.label}
              leading={<DesignIcon name="star" size={16} filled />}
              onPress={() => navigation.navigate("RouteResult", { origin: chip.origin, destination: chip.destination })}
            />
          ))}
        </ScrollView>

        <View style={{ top: searchTop + FAB_OFFSET }} className="absolute right-4 gap-2.5">
          <FloatingButton label="2D/3D 지도 전환" selected={is3d} onPress={() => setIs3d((value) => !value)}>
            <Text className={cn("text-body-sm font-sans-bold", is3d ? "text-on-primary" : "text-text")}>
              {is3d ? "2D" : "3D"}
            </Text>
          </FloatingButton>
          <FloatingButton label="즐겨찾기" onPress={() => navigation.navigate("Search")}>
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

        {activeGuide ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`안내 화면으로 돌아가기, ${minutesLabel(activeGuide.remainingSec)} 남음`}
            onPress={() =>
              navigation.navigate("LiveNav", {
                sessionId: activeGuide.sessionId,
                option: activeGuide.option,
                startedAtMs: activeGuide.startedAtMs,
              })
            }
            style={{ bottom: (selectedPlace ? PLACE_CARD_HEIGHT : SHEET_PEEK_HEIGHT) + 16 }}
            className="absolute right-4 h-17 w-17 items-center justify-center gap-px rounded-pill border-4 border-bg bg-primary"
          >
            <Text className="text-title font-sans-bold text-on-primary">안내</Text>
            <Text className="text-small font-sans-bold text-on-primary">{minutesLabel(activeGuide.remainingSec)}</Text>
          </Pressable>
        ) : null}

        {selectedPlace ? (
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
                    onPress={() => navigation.navigate("Search", { destination: destination.endpoint })}
                    className="h-15 flex-row items-center gap-3 border-b border-border"
                  >
                    <View className="h-9 w-9 items-center justify-center rounded-pill bg-surface">
                      <DesignIcon name="clock" size={18} tone="secondary" />
                    </View>
                    <View className="flex-1 flex-row items-center gap-1.5">
                      <Text numberOfLines={1} className="shrink text-base font-sans-bold">
                        {destination.endpoint.name}
                      </Text>
                      {lineIds.map((lineId) => (
                        <LineBadge key={lineId} lineId={lineId} size="sm" />
                      ))}
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
