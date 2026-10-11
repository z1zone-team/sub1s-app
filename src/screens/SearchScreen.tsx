import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ApiError } from "@/apis/client";
import { usePlaceSearchQuery } from "@/apis/queries/places/usePlaceSearchQuery";
import { Screen } from "@/common/components/Screen";
import { LineBadge } from "@/common/components/LineBadge";
import { useForegroundLocation } from "@/common/device";
import { formatMonthDayKst } from "@/common/utils/format";
import {
  endpointFromCoords,
  isSameEndpoint,
  isValidEndpoint,
  type RouteEndpoint,
} from "@/features/routing/endpoint";
import { toSearchRows, type SearchRow } from "@/features/routing/searchRows";
import { useRecentDestinations } from "@/features/routing/useRecentDestinations";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { useTheme } from "@/theme";

type Field = "origin" | "destination";

const SEARCH_DEBOUNCE_MS = 300;

export function SearchScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "Search">) {
  const { colors } = useTheme();
  const presetDestination = route.params?.destination;

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
    if (locationDenied && !origin) setActive("origin");
  }, [locationDenied, origin]);

  const query = useDebouncedValue(text, SEARCH_DEBOUNCE_MS);
  const search = usePlaceSearchQuery({
    q: query,
    lat: location.coords?.latitude,
    lng: location.coords?.longitude,
  });
  const rows = useMemo(() => toSearchRows(search.data?.items ?? []), [search.data]);

  // 두 지점은 사용자가 고르거나 미리 정해서 들어온 경우, 위치가 잡힌 경우에만 채워지므로 둘 다 정해지면 바로 경로 목록으로 간다
  useEffect(() => {
    if (navigated.current) return;
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
  }, [origin, destination, navigation, recent]);

  const choose = useCallback(
    (endpoint: RouteEndpoint) => {
      setText("");
      if (active === "origin") {
        setOriginChosenByUser(true);
        setOrigin(endpoint);
        if (!destination) setActive("destination");
      } else {
        setDestination(endpoint);
        if (!origin) setActive("origin");
      }
    },
    [active, destination, origin]
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
      <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로"
          onPress={() => navigation.goBack()}
          style={{ height: 40, justifyContent: "center" }}
        >
          <Text style={{ fontSize: 22, color: colors.text }}>{"‹"}</Text>
        </Pressable>

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
        <FieldRow
          label="도착"
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
        {locationDenied ? (
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            위치 권한이 없어 출발지를 직접 입력해야 해요.
          </Text>
        ) : null}
        {sameStationWarning ? (
          <Text style={{ fontSize: 12, color: colors.error }}>
            출발지와 도착지가 같아요. 다른 곳을 골라 주세요.
          </Text>
        ) : null}
      </View>

      <FlatList
        style={{ flex: 1, marginTop: 8 }}
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
            <Text style={{ padding: 24, textAlign: "center", color: colors.textSecondary }}>
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
  const { colors } = useTheme();

  return (
    <View
      style={{
        height: 48,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
        backgroundColor: colors.surface,
      }}
    >
      <Text style={{ width: 28, fontSize: 13, fontWeight: "700", color: colors.textSecondary }}>
        {label}
      </Text>
      {active ? (
        <TextInput
          autoFocus
          value={text}
          onChangeText={onChangeText}
          placeholder={endpoint?.name || placeholder}
          placeholderTextColor={colors.textDisabled}
          returnKeyType="search"
          style={{ flex: 1, fontSize: 16, color: colors.text, padding: 0 }}
        />
      ) : (
        <Pressable accessibilityRole="button" onPress={onActivate} style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 16,
              color: endpoint ? colors.text : colors.textDisabled,
            }}
          >
            {endpoint?.name || placeholder}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function ResultRow({ row, onPress }: { row: SearchRow; onPress: () => void }) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        paddingHorizontal: 20,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
          {row.title}
        </Text>
        {row.subtitle ? (
          <Text numberOfLines={1} style={{ fontSize: 13, color: colors.textSecondary }}>
            {row.subtitle}
          </Text>
        ) : null}
        {row.hint ? (
          <Text numberOfLines={1} style={{ fontSize: 12, color: colors.textSecondary }}>
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
  const { colors } = useTheme();

  if (recent.destinations.length === 0) {
    return (
      <Text style={{ padding: 24, textAlign: "center", color: colors.textSecondary }}>
        최근 검색 기록이 없어요
      </Text>
    );
  }

  return (
    <View>
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 8,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary }}>최근 검색</Text>
        <Pressable accessibilityRole="button" onPress={() => void recent.clear()}>
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>전체 삭제</Text>
        </Pressable>
      </View>
      {recent.destinations.map((destination) => {
        const lineIds = destination.endpoint.stationId
          ? recent.linesOfStation.get(destination.endpoint.stationId) ?? []
          : [];
        return (
          <View
            key={destination.routeIds[0]}
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => onSelect(destination.endpoint)}
              style={{
                flex: 1,
                paddingLeft: 20,
                paddingVertical: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Text numberOfLines={1} style={{ fontSize: 16, color: colors.text }}>
                {destination.endpoint.name}
              </Text>
              {lineIds.map((lineId) => (
                <LineBadge key={lineId} lineId={lineId} size="sm" />
              ))}
              <Text style={{ marginLeft: "auto", fontSize: 12, color: colors.textSecondary }}>
                {formatMonthDayKst(destination.searchedAt)}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="기록 삭제"
              onPress={() => recent.remove(destination)}
              style={{ paddingHorizontal: 16, paddingVertical: 14 }}
            >
              <Text style={{ color: colors.textDisabled }}>{"✕"}</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
