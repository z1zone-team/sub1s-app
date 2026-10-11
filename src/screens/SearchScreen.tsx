import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ApiError } from "@/apis/client";
import { usePlaceSearchQuery } from "@/apis/queries/places/usePlaceSearchQuery";
import { Screen } from "@/common/components/Screen";
import { Icon } from "@/common/components/Icon";
import { LineBadge } from "@/common/components/LineBadge";
import { Text } from "@/common/components/Text";
import { useForegroundLocation } from "@/common/device";
import { formatMonthDayKst } from "@/common/utils/format";
import {
  endpointFromCoords,
  isSameEndpoint,
  isValidEndpoint,
  type RouteEndpoint,
} from "@/features/routing/endpoint";
import { toSearchRows, type SearchRow } from "@/features/routing/searchRows";
import { endpointToSaveBody, PLACE_LABEL } from "@/features/places/placeEndpoint";
import { useSavePlaceMutation } from "@/apis/queries/users/useUserPlaces";
import { useRecentDestinations } from "@/features/routing/useRecentDestinations";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { cn } from "@/lib/cn";

type Field = "origin" | "destination";

const SEARCH_DEBOUNCE_MS = 300;

export function SearchScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "Search">) {
  const presetDestination = route.params?.destination;
  const pickPlace = route.params?.pickPlace;
  const savePlace = useSavePlaceMutation();

  const [origin, setOrigin] = useState<RouteEndpoint | undefined>();
  const [destination, setDestination] = useState<RouteEndpoint | undefined>(presetDestination);
  const [active, setActive] = useState<Field>("destination");
  const [text, setText] = useState("");
  const [originChosenByUser, setOriginChosenByUser] = useState(false);
  const navigated = useRef(false);

  const location = useForegroundLocation({ autoStart: true });
  const recent = useRecentDestinations();

  // 위치를 받으면 사용자가 출발지를 직접 고르기 전까지 현재 위치를 출발지로 쓴다
  useEffect(() => {
    if (originChosenByUser || !location.coords) return;
    setOrigin(endpointFromCoords(location.coords.latitude, location.coords.longitude));
  }, [location.coords, originChosenByUser]);

  const locationDenied = location.error === "LOCATION_PERMISSION_DENIED";
  useEffect(() => {
    if (!pickPlace && locationDenied && !origin) setActive("origin");
  }, [pickPlace, locationDenied, origin]);

  const query = useDebouncedValue(text, SEARCH_DEBOUNCE_MS);
  const search = usePlaceSearchQuery({
    q: query,
    lat: location.coords?.latitude,
    lng: location.coords?.longitude,
  });
  const rows = useMemo(() => toSearchRows(search.data?.items ?? []), [search.data]);

  // 두 지점은 사용자가 고르거나 미리 정해서 들어온 경우, 위치가 잡힌 경우에만 채워지므로 둘 다 정해지면 바로 경로 목록으로 간다
  useEffect(() => {
    if (pickPlace || navigated.current) return;
    if (!isValidEndpoint(origin) || !isValidEndpoint(destination)) return;
    if (isSameEndpoint(origin, destination)) return;

    navigated.current = true;
    void recent.addRoute({
      origin: origin.name,
      originStationId: origin.stationId,
      originLat: origin.lat,
      originLng: origin.lng,
      destination: destination.name,
      destStationId: destination.stationId,
      destLat: destination.lat,
      destLng: destination.lng,
    });
    navigation.replace("RouteResult", { origin, destination });
  }, [pickPlace, origin, destination, navigation, recent]);

  const choose = useCallback(
    (endpoint: RouteEndpoint) => {
      setText("");
      if (pickPlace) {
        const body = endpointToSaveBody(endpoint);
        if (body) savePlace.mutate({ kind: pickPlace, body }, { onSuccess: () => navigation.goBack() });
        return;
      }
      if (active === "origin") {
        setOriginChosenByUser(true);
        setOrigin(endpoint);
        if (!destination) setActive("destination");
      } else {
        setDestination(endpoint);
        if (!origin) setActive("origin");
      }
    },
    [pickPlace, savePlace, navigation, active, destination, origin]
  );

  const sameStationWarning =
    isValidEndpoint(origin) && isValidEndpoint(destination) && isSameEndpoint(origin, destination);

  const showRecent = active === "destination" && text.trim().length === 0;

  const typing = text.trim() !== query.trim();

  const errorMessage = (() => {
    if (!search.error) return undefined;
    if (search.error instanceof ApiError && search.error.status === 429) {
      return "검색이 너무 잦아요. 잠시 후 다시 시도해 주세요.";
    }
    return "검색 결과를 불러오지 못했어요.";
  })();

  return (
    <Screen>
      <View className="gap-2 px-4 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로"
          onPress={() => navigation.goBack()}
          className="h-control justify-center"
        >
          <Icon name="chevron-back" size={26} />
        </Pressable>

        {pickPlace ? (
          <Text className="text-title font-sans-extrabold">{PLACE_LABEL[pickPlace]}으로 지정할 장소</Text>
        ) : (
          <FieldRow
            label="출발"
            endpoint={origin}
            placeholder={locationDenied ? "출발지를 입력하세요" : "현재 위치 확인 중"}
            active={active === "origin"}
            text={text}
            onChangeText={setText}
            onActivate={() => {
              setActive("origin");
              setText("");
            }}
          />
        )}
        <FieldRow
          label={pickPlace ? "장소" : "도착"}
          endpoint={destination}
          placeholder="도착지 입력"
          active={active === "destination"}
          text={text}
          onChangeText={setText}
          onActivate={() => {
            setActive("destination");
            setText("");
          }}
        />
        {savePlace.error ? <Text className="text-small text-error">저장하지 못했어요. 다시 시도해 주세요.</Text> : null}
        {locationDenied && !pickPlace ? (
          <Text className="text-small text-text-secondary">위치 권한이 없어 출발지를 직접 입력해야 해요.</Text>
        ) : null}
        {sameStationWarning ? (
          <Text className="text-small text-error">출발지와 도착지가 같아요. 다른 곳을 골라 주세요.</Text>
        ) : null}
      </View>

      <FlatList
        className="mt-2 flex-1"
        keyboardShouldPersistTaps="handled"
        data={showRecent ? [] : rows}
        keyExtractor={(row) => row.key}
        renderItem={({ item }) => <ResultRow row={item} onPress={() => choose(item.endpoint)} />}
        ListHeaderComponent={
          showRecent ? (
            <RecentList
              recent={recent}
              onSelect={(endpoint) => choose(endpoint)}
            />
          ) : null
        }
        ListEmptyComponent={
          showRecent ? null : (
            <Text className="p-6 text-center text-text-secondary">
              {errorMessage ?? (typing || search.isFetching ? "검색 중..." : "검색 결과가 없어요")}
            </Text>
          )
        }
      />
    </Screen>
  );
}

interface FieldRowProps {
  label: string;
  endpoint: RouteEndpoint | undefined;
  placeholder: string;
  active: boolean;
  text: string;
  onChangeText: (value: string) => void;
  onActivate: () => void;
}

function FieldRow({
  label,
  endpoint,
  placeholder,
  active,
  text,
  onChangeText,
  onActivate,
}: FieldRowProps) {
  return (
    <View
      className={cn("h-row flex-row items-center gap-3 rounded-md border bg-surface px-3.5", active ? "border-primary" : "border-border")}
    >
      <Text className="w-7 text-body-sm font-sans-bold text-text-secondary">{label}</Text>
      {active ? (
        <TextInput
          autoFocus
          value={text}
          onChangeText={onChangeText}
          placeholder={endpoint?.name || placeholder}
          placeholderClassName="text-text-disabled"
          returnKeyType="search"
          className="flex-1 p-0 font-sans text-base text-text"
        />
      ) : (
        <Pressable accessibilityRole="button" onPress={onActivate} className="flex-1">
          <Text numberOfLines={1} className={cn("text-base", endpoint ? "text-text" : "text-text-disabled")}>
            {endpoint?.name || placeholder}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function ResultRow({ row, onPress }: { row: SearchRow; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-3 border-b border-border px-5 py-3.5"
    >
      <View className="flex-1 gap-0.5">
        <Text numberOfLines={1} className="text-base font-sans-semibold">
          {row.title}
        </Text>
        {row.subtitle ? (
          <Text numberOfLines={1} className="text-body-sm text-text-secondary">
            {row.subtitle}
          </Text>
        ) : null}
        {row.hint ? (
          <Text numberOfLines={1} className="text-small text-text-secondary">
            {row.hint}
          </Text>
        ) : null}
      </View>
      {row.lineIds.map((lineId) => (
        <LineBadge key={lineId} lineId={lineId} />
      ))}
    </Pressable>
  );
}

function RecentList({
  recent,
  onSelect,
}: {
  recent: ReturnType<typeof useRecentDestinations>;
  onSelect: (endpoint: RouteEndpoint) => void;
}) {
  if (recent.destinations.length === 0) {
    return <Text className="p-6 text-center text-text-secondary">최근 검색 기록이 없어요</Text>;
  }

  return (
    <View>
      <View className="flex-row justify-between px-5 py-2">
        <Text className="text-body-sm font-sans-bold text-text-secondary">최근 검색</Text>
        <Pressable accessibilityRole="button" onPress={() => void recent.clear()}>
          <Text className="text-body-sm text-text-secondary">전체 삭제</Text>
        </Pressable>
      </View>
      {recent.destinations.map((destination) => {
        const lineIds = destination.endpoint.stationId
          ? recent.linesOfStation.get(destination.endpoint.stationId) ?? []
          : [];
        return (
          <View key={destination.routeIds[0]} className="flex-row items-center border-b border-border">
            <Pressable
              accessibilityRole="button"
              onPress={() => onSelect(destination.endpoint)}
              className="flex-1 flex-row items-center gap-2 py-3.5 pl-5"
            >
              <Text numberOfLines={1} className="text-base">
                {destination.endpoint.name}
              </Text>
              {lineIds.map((lineId) => (
                <LineBadge key={lineId} lineId={lineId} size="sm" />
              ))}
              <Text className="ml-auto text-small text-text-secondary">
                {formatMonthDayKst(destination.searchedAt)}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="기록 삭제"
              onPress={() => recent.remove(destination)}
              className="px-4 py-3.5"
            >
              <Icon name="close" size={18} tone="disabled" />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
