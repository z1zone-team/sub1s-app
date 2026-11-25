import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { Button } from "@/common/components/Button";
import { DraggableSheet } from "@/common/components/DraggableSheet";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { LAST_KNOWN_MAX_AGE_MS, useForegroundLocation } from "@/common/device";
import { formatDistanceKm, formatDurationSec } from "@/common/utils/format";
import { WalkBanner } from "@/features/guide/components/WalkBanner";
import { guideMapData } from "@/features/guide/guideMap";
import { remainingParts } from "@/features/guide/guideText";
import { type LatLng, walkProgress } from "@/features/guide/walkGuide";
import { VWorldMap } from "@/features/map/VWorldMap";
import { endpointCoords, type RouteEndpoint } from "@/features/routing/endpoint";
import type { RootStackParamList } from "@/navigation/navigation-types";

type Props = NativeStackScreenProps<RootStackParamList, "WalkNav">;

const NO_STATIONS: ReadonlyMap<string, LatLng> = new Map();

/** 지하철 없이 걷기만 하는 경로의 안내. 서버 세션 없이 앱 안에서만 남은 거리와 시간을 보여 주고 도착지 가까이 오면 도착으로 본다 */
export function WalkNavScreen({ navigation, route }: Props) {
  const { option, origin, destination, railArrival } = route.params;
  const from = endpointCoords(origin);
  const to = endpointCoords(destination);
  const finishLabel = railArrival ? "이동 결과 보기" : "홈으로";
  const finish = () => {
    if (railArrival) return navigation.replace("Arrived", railArrival);
    navigation.navigate("MainTabs", { screen: "HomeTab", params: { recenterRequest: Date.now() } });
  };

  if (!from || !to) {
    return (
      <Screen edges={[]} contentClassName="items-center justify-center gap-4 p-6">
        <Text className="text-center">출발지나 도착지의 위치를 알 수 없어 걸어서 안내할 수 없어요.</Text>
        <Button label={finishLabel} onPress={finish} />
      </Screen>
    );
  }

  return <WalkGuide option={option} destination={destination} from={from} to={to} onFinish={finish} finishLabel={finishLabel} />;
}

interface WalkGuideProps {
  option: SubwayRouteOptionDto;
  destination: RouteEndpoint;
  from: LatLng;
  to: LatLng;
  onFinish: () => void;
  finishLabel: string;
}

function WalkGuide({ option, destination, from, to, onFinish, finishLabel }: WalkGuideProps) {
  const insets = useSafeAreaInsets();
  const location = useForegroundLocation({ autoStart: true, lastKnownMaxAgeMs: LAST_KNOWN_MAX_AGE_MS });
  const coords = location.coords;
  const me = useMemo(() => (coords ? { lat: coords.latitude, lng: coords.longitude } : undefined), [coords]);
  const progress = useMemo(
    () =>
      walkProgress({
        origin: from,
        destination: to,
        me,
        totalDurationSec: option.totalDurationSec,
        totalDistanceKm: option.totalDistanceKm,
      }),
    [from, to, me, option.totalDurationSec, option.totalDistanceKm]
  );
  const [arrived, setArrived] = useState(false);
  useEffect(() => {
    if (progress.arrived) setArrived(true);
  }, [progress.arrived]);

  const mapData = useMemo(
    () => guideMapData(option, NO_STATIONS, me, { origin: from, destination: to }),
    [option, me, from, to]
  );
  const parts = remainingParts(progress.remainingSec, Date.now());
  const denied = location.error === "LOCATION_PERMISSION_DENIED";

  const bottomPadding = Math.max(insets.bottom, 12) + 10;

  return (
    <View className="flex-1 bg-surface">
      <VWorldMap data={mapData} className="absolute inset-0" />

      <View style={{ top: insets.top + 8 }} className="absolute inset-x-3">
        <WalkBanner
          destinationName={destination.name}
          summary={`${formatDistanceKm(progress.remainingM / 1000)} · 약 ${formatDurationSec(progress.remainingSec)}`}
          arrived={arrived}
          onBack={onFinish}
        />
      </View>

      <DraggableSheet
        label="도보 안내"
        className="px-5"
        bottomInset={bottomPadding}
        coverBottom
        header={
          arrived ? (
            <Text className="text-headline font-sans-bold">도착했어요</Text>
          ) : (
            <View className="flex-row items-baseline">
              <Text className="text-headline font-sans-bold">{parts.amount}</Text>
              <Text className="ml-1.5 text-body-sm text-text-secondary">{parts.rest}</Text>
            </View>
          )
        }
      >
        <View style={{ paddingBottom: bottomPadding }}>
          {!arrived && !me ? (
            <Text className="mt-2 text-small text-text-secondary">
              {denied ? "위치 권한이 없어 남은 거리를 정확히 알 수 없어요." : "현재 위치를 찾는 중이에요."}
            </Text>
          ) : null}
          <Button
            label={arrived ? finishLabel : "안내 끝내기"}
            variant={arrived ? "primary" : "secondary"}
            onPress={onFinish}
            className="mt-3"
          />
        </View>
      </DraggableSheet>
    </View>
  );
}
