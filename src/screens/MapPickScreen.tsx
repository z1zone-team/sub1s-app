import React, { useState } from "react";
import { Pressable, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReversePlaceMutation } from "@/apis/queries/places/useReversePlaceMutation";
import { DesignIcon } from "@/common/components/DesignIcon";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { PickConfirmCard } from "@/features/map/components/PickConfirmCard";
import { PickStatusCard } from "@/features/map/components/PickStatusCard";
import { pickErrorMessage } from "@/features/map/pickMessage";
import { useHomeMapData } from "@/features/map/useHomeMapData";
import { VWorldMap } from "@/features/map/VWorldMap";
import { toPlaceRow, type SearchRow } from "@/features/routing/searchRows";
import type { RootStackParamList } from "@/navigation/navigation-types";

/** 길찾기에서 현재 위치를 잡지 못했을 때 지도를 길게 눌러 출발지를 정하는 화면. 정하면 길찾기로 돌아간다 */
export function MapPickScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "MapPick">) {
  const insets = useSafeAreaInsets();
  const [pick, setPick] = useState<{ lat: number; lng: number } | null>(null);
  const [place, setPlace] = useState<SearchRow | null>(null);
  const reverse = useReversePlaceMutation();
  const mapData = useHomeMapData(pick ?? undefined);

  const close = () => {
    reverse.reset();
    setPick(null);
    setPlace(null);
  };
  const onLongPress = (point: { lat: number; lng: number }) => {
    setPlace(null);
    setPick(point);
    reverse.mutate(point, { onSuccess: (item) => setPlace(toPlaceRow(item)) });
  };

  return (
    <Screen edges={["bottom"]}>
      <View className="flex-1 bg-surface">
        <VWorldMap data={mapData} className="flex-1" onLongPress={onLongPress} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로"
          onPress={() => navigation.goBack()}
          style={{ top: insets.top + 10 }}
          className="absolute left-4 h-control w-control items-center justify-center rounded-pill border border-border bg-bg"
        >
          <DesignIcon name="back" />
        </Pressable>

        {pick ? null : (
          <View
            style={{ top: insets.top + 10 }}
            className="absolute left-20 right-4 h-control justify-center rounded-pill border border-border bg-bg px-4"
          >
            <Text className="text-body font-sans-semibold">지도를 길게 눌러 출발지를 골라 주세요</Text>
          </View>
        )}

        {place ? (
          <PickConfirmCard
            place={place}
            confirmLabel="여기서 출발"
            onConfirm={() => navigation.popTo("Search", { origin: place.endpoint }, { merge: true })}
            onClose={close}
          />
        ) : pick ? (
          <PickStatusCard errorMessage={reverse.isError ? pickErrorMessage(reverse.error) : undefined} onClose={close} />
        ) : null}
      </View>
    </Screen>
  );
}
