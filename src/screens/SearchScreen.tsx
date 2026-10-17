import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ApiError } from "@/apis/client";
import { usePlaceSearchQuery } from "@/apis/queries/places/usePlaceSearchQuery";
import { useSavePlaceMutation, useUserPlacesQuery } from "@/apis/queries/users/useUserPlaces";
import { DesignIcon } from "@/common/components/DesignIcon";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { LAST_KNOWN_MAX_AGE_MS, LOCATION_FIX_TIMEOUT_MS, useForegroundLocation } from "@/common/device";
import {
  endpointFromCoords,
  isSameEndpoint,
  isValidEndpoint,
  type RouteEndpoint,
} from "@/features/routing/endpoint";
import { toSearchRows } from "@/features/routing/searchRows";
import { useRecentDestinations } from "@/features/routing/useRecentDestinations";
import { endpointToSaveBody, PLACE_LABEL, placeOfKind, placeToEndpoint } from "@/features/places/placeEndpoint";
import { OriginFallback } from "@/features/search/components/OriginFallback";
import { RecentSearchList } from "@/features/search/components/RecentSearchList";
import { RouteEndpointBox, type EndpointField } from "@/features/search/components/RouteEndpointBox";
import { SearchResultRow } from "@/features/search/components/SearchResultRow";
import { shouldOfferOriginFallback, swapEndpoints } from "@/features/search/searchLogic";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { RootStackParamList } from "@/navigation/navigation-types";

const SEARCH_DEBOUNCE_MS = 300;

/** 길찾기. 출발과 도착 두 칸을 채우면 경로 목록으로 간다. 지도 검색(MapSearch)과는 다른 화면이다 */
export function SearchScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "Search">) {
  const presetOrigin = route.params?.origin;
  const presetDestination = route.params?.destination;
  const pickPlace = route.params?.pickPlace;
  const savePlace = useSavePlaceMutation();

  const [origin, setOrigin] = useState<RouteEndpoint | undefined>(presetOrigin);
  const [destination, setDestination] = useState<RouteEndpoint | undefined>(presetDestination);
  const [active, setActive] = useState<EndpointField>("destination");
  const [text, setText] = useState("");
  const [originChosenByUser, setOriginChosenByUser] = useState(Boolean(presetOrigin));
  const navigated = useRef(false);

  const location = useForegroundLocation({
    autoStart: true,
    lastKnownMaxAgeMs: LAST_KNOWN_MAX_AGE_MS,
    fixTimeoutMs: LOCATION_FIX_TIMEOUT_MS,
  });
  const recent = useRecentDestinations();
  const places = useUserPlacesQuery();
  const homePlace = placeOfKind(places.data, "HOME");

  // 지도 선택 화면에서 돌아오며 넘긴 출발지. 사용자가 정한 것이라 이후 위치가 와도 바꾸지 않는다
  useEffect(() => {
    if (!presetOrigin) return;
    setOrigin(presetOrigin);
    setOriginChosenByUser(true);
    setActive("destination");
  }, [presetOrigin]);

  // 위치를 받으면 사용자가 출발지를 직접 고르기 전까지 현재 위치를 출발지로 쓴다
  useEffect(() => {
    if (originChosenByUser || !location.coords) return;
    setOrigin(endpointFromCoords(location.coords.latitude, location.coords.longitude));
  }, [location.coords, originChosenByUser]);

  const locationDenied = location.error === "LOCATION_PERMISSION_DENIED";
  const offerOriginFallback =
    !pickPlace &&
    shouldOfferOriginFallback({ fixTimedOut: location.fixTimedOut, locationDenied, originChosenByUser, origin });
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
        void recent.addDestination(endpoint);
        setDestination(endpoint);
        if (!origin) setActive("origin");
      }
    },
    [pickPlace, savePlace, navigation, active, destination, origin, recent.addDestination]
  );

  const swap = useCallback(() => {
    const swapped = swapEndpoints(origin, destination);
    setOriginChosenByUser(true);
    setOrigin(swapped.origin);
    setDestination(swapped.destination);
    setText("");
    setActive(swapped.origin ? "destination" : "origin");
  }, [origin, destination]);

  const sameStationWarning =
    isValidEndpoint(origin) && isValidEndpoint(destination) && isSameEndpoint(origin, destination);

  const showSuggestions = active === "destination" && text.trim().length === 0;

  const typing = text.trim() !== query.trim();

  const errorMessage = (() => {
    if (!search.error) return undefined;
    if (search.error instanceof ApiError && search.error.status === 429) {
      return "검색이 너무 잦아요. 잠시 후 다시 시도해 주세요.";
    }
    return "검색 결과를 불러오지 못했어요.";
  })();

  return (
    <Screen surface>
      <View className="px-4 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로"
          onPress={() => navigation.goBack()}
          className="-ml-3 h-control w-control items-center justify-center"
        >
          <DesignIcon name="back" />
        </Pressable>
        {pickPlace ? (
          <Text className="pb-1 text-title font-sans-bold">{PLACE_LABEL[pickPlace]}으로 지정할 장소</Text>
        ) : null}
      </View>

      {pickPlace ? (
        <View className="mx-4 mt-1 h-12 justify-center rounded-lg border border-primary px-4">
          <PickPlaceInput
            text={text}
            onChangeText={setText}
            placeholder={destination?.name || "장소 입력"}
          />
        </View>
      ) : (
        <RouteEndpointBox
          origin={origin}
          destination={destination}
          active={active}
          text={text}
          onChangeText={setText}
          onActivate={(field) => {
            setActive(field);
            setText("");
          }}
          onSwap={swap}
          originPlaceholder={locationDenied ? "출발지를 입력하세요" : originChosenByUser ? "출발지 입력" : "현재 위치 확인 중"}
          destinationPlaceholder="어디로 갈까요?"
        />
      )}

      <View className="gap-1 px-5 pt-2">
        {savePlace.error ? <Text className="text-small text-error">저장하지 못했어요. 다시 시도해 주세요.</Text> : null}
        {offerOriginFallback ? (
          <OriginFallback
            denied={locationDenied}
            homeName={homePlace ? homePlace.name : undefined}
            onHome={() => {
              if (!homePlace) return;
              setOriginChosenByUser(true);
              setOrigin(placeToEndpoint(homePlace));
              if (!destination) setActive("destination");
            }}
            onPickOnMap={() => navigation.navigate("MapPick")}
          />
        ) : null}
        {sameStationWarning ? (
          <Text className="text-small text-error">출발지와 도착지가 같아요. 다른 곳을 골라 주세요.</Text>
        ) : null}
      </View>

      <FlatList
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        data={showSuggestions ? [] : rows}
        keyExtractor={(row) => row.key}
        renderItem={({ item }) => <SearchResultRow row={item} onPress={() => choose(item.endpoint)} />}
        ListHeaderComponent={
          showSuggestions ? (
            <View className="pb-8">
              <RecentSearchList recent={recent} onSelect={(endpoint) => choose(endpoint)} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          showSuggestions || text.trim().length === 0 ? null : (
            <Text className="p-6 text-center text-text-secondary">
              {errorMessage ?? (typing || search.isFetching ? "검색 중..." : "검색 결과가 없어요")}
            </Text>
          )
        }
      />
    </Screen>
  );
}

/** 집이나 학교로 저장할 장소를 찾는 입력칸. 출발/도착 박스를 쓰지 않는 모드라서 입력칸만 따로 둔다 */
function PickPlaceInput({
  text,
  onChangeText,
  placeholder,
}: {
  text: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <TextInput
      autoFocus
      value={text}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderClassName="text-text-disabled"
      returnKeyType="search"
      className="h-12 p-0 font-sans-semibold text-subtitle text-text"
    />
  );
}
