import React, { useMemo, useState } from "react";
import { FlatList, Pressable, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ApiError } from "@/apis/client";
import { usePlaceSearchQuery } from "@/apis/queries/places/usePlaceSearchQuery";
import { DesignIcon } from "@/common/components/DesignIcon";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { useForegroundLocation } from "@/common/device";
import { toSearchRows } from "@/features/routing/searchRows";
import { useRecentDestinations } from "@/features/routing/useRecentDestinations";
import { RecentSearchList } from "@/features/search/components/RecentSearchList";
import { SearchResultRow } from "@/features/search/components/SearchResultRow";
import { rowFromEndpoint } from "@/features/search/searchLogic";
import { useSelectedPlaceStore } from "@/features/search/selected-place-store";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { RootStackParamList } from "@/navigation/navigation-types";

const SEARCH_DEBOUNCE_MS = 300;

/** 홈의 검색 필이 여는 지도 검색. 입력은 한 칸이고, 장소를 고르면 홈으로 돌아가 지도에 핀과 하단 카드로 보여 준다 */
export function MapSearchScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "MapSearch">) {
  const [text, setText] = useState("");
  const selectPlace = useSelectedPlaceStore((state) => state.select);
  const location = useForegroundLocation({ autoStart: true });
  const recent = useRecentDestinations();

  const query = useDebouncedValue(text, SEARCH_DEBOUNCE_MS);
  const search = usePlaceSearchQuery({
    q: query,
    lat: location.coords?.latitude,
    lng: location.coords?.longitude,
  });
  const rows = useMemo(() => toSearchRows(search.data?.items ?? []), [search.data]);

  const showRecent = text.trim().length === 0;
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
      <View className="flex-row items-center gap-1.5 px-4 pb-3 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로"
          onPress={() => navigation.goBack()}
          className="h-control w-control items-center justify-center"
        >
          <DesignIcon name="back" />
        </Pressable>
        <View className="h-12 flex-1 flex-row items-center gap-2 rounded-md bg-surface pl-3.5 pr-1.5">
          <DesignIcon name="search" size={18} tone="secondary" />
          <TextInput
            autoFocus
            value={text}
            onChangeText={setText}
            placeholder="어디로 갈까요?"
            placeholderClassName="text-text-disabled"
            returnKeyType="search"
            accessibilityLabel="어디로 갈까요?"
            className="h-12 flex-1 p-0 font-sans text-base text-text"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="음성 검색"
            onPress={() => navigation.navigate("Voice")}
            className="h-9 w-9 items-center justify-center rounded-pill"
          >
            <DesignIcon name="mic" size={20} />
          </Pressable>
        </View>
      </View>

      <FlatList
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        data={showRecent ? [] : rows}
        keyExtractor={(row) => row.key}
        renderItem={({ item }) => (
          <SearchResultRow
            row={item}
            onPress={() => {
              selectPlace(item);
              void recent.addDestination(item.endpoint);
              navigation.goBack();
            }}
          />
        )}
        ListHeaderComponent={
          showRecent ? (
            <RecentSearchList
              recent={recent}
              onSelect={(endpoint) => {
                void recent.addDestination(endpoint);
                const lineIds = endpoint.stationId ? recent.linesOfStation.get(endpoint.stationId) ?? [] : [];
                selectPlace(rowFromEndpoint(endpoint, lineIds));
                navigation.goBack();
              }}
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
