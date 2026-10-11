import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { useCreateTravelLogMutation } from "@/apis/mutations/travel/useCreateTravelLogMutation";
import { Button } from "@/common/components/Button";
import { LineBadge } from "@/common/components/LineBadge";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { StopStrip } from "@/features/guide/components/StopStrip";
import { visibleStopIndexes } from "@/features/guide/progress";
import { remainingText, upcomingMessage } from "@/features/guide/guideText";
import { useGuide } from "@/features/guide/useGuide";
import { describeDoor } from "@/features/routing/routeView";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { cn } from "@/lib/cn";

type Props = NativeStackScreenProps<RootStackParamList, "LiveNav">;

export function LiveNavScreen({ navigation, route }: Props) {
  const { sessionId, option, startedAtMs } = route.params;

  if (!option || !startedAtMs) {
    return (
      <Screen edges={[]} contentClassName="items-center justify-center gap-4 p-6">
        <Text className="text-center">진행 중인 안내를 찾지 못했어요.</Text>
        <Button label="홈으로" onPress={() => navigation.navigate("MainTabs", { screen: "HomeTab" })} />
      </Screen>
    );
  }

  return (
    <Guide navigation={navigation} sessionId={sessionId} option={option} startedAtMs={startedAtMs} />
  );
}

interface GuideProps {
  navigation: Props["navigation"];
  sessionId: string;
  option: SubwayRouteOptionDto;
  startedAtMs: number;
}

function Guide({ navigation, sessionId, option, startedAtMs }: GuideProps) {
  const guide = useGuide({ option, sessionId, startedAtMs });
  const createLog = useCreateTravelLogMutation();
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    if (!guide.alert) return;
    navigation.navigate("OffRoute", {
      alert: guide.alert,
      remainingSec: guide.progress.remainingSec,
    });
    guide.clearAlert();
  }, [guide.alert]);

  const { stops, info, progress, nowMs, segment, upcoming } = guide;
  const nameAt = (index: number) => info.get(stops[index]?.stationId ?? "")?.name ?? "";
  const names = stops.map((_, index) => nameAt(index));
  const destination = nameAt(stops.length - 1);
  const visible = visibleStopIndexes(names);
  const stripCurrent = visible.filter((index) => index <= progress.currentIndex).length - 1;
  const stopsLeft = visible.filter((index) => index > progress.currentIndex).length;
  const nextVisible = visible.find((index) => index > progress.currentIndex) ?? progress.nextIndex;
  const upcomingAway = upcoming
    ? visible.filter((index) => index > progress.currentIndex && index <= upcoming.index).length
    : 0;
  const weakAcCars = (segment?.cars ?? []).filter((car) => car.isWeakAirConditioned).map((car) => car.carNo);
  const doors = segment?.recommendedDoors ?? [];
  const nearEnd = stopsLeft <= 1;

  const arrive = () => {
    const origin = stops[0]?.stationId;
    const dest = stops[stops.length - 1]?.stationId;
    if (!origin || !dest || createLog.isPending) return;
    createLog.mutate(
      { originStationId: origin, destStationId: dest, sessionId },
      {
        onSuccess: (log) =>
          navigation.replace("Arrived", { log, destinationName: destination, arrivedAtMs: Date.now() }),
      }
    );
  };

  return (
    <Screen edges={[]} scroll contentClassName="px-5">
      <View className="gap-2 py-4">
        <View className="flex-row items-center gap-2">
          {segment ? (
            <LineBadge lineId={segment.lineId} suffix={segment.isExpress ? "급행" : undefined} />
          ) : null}
          <Text className="text-body-sm font-sans-bold text-primary">안내 중</Text>
        </View>
        <Text className="text-headline font-sans-extrabold">
          {destination || "도착역"}까지 {stopsLeft}개 역
        </Text>
        <Text className="text-body text-text-secondary">{remainingText(progress.remainingSec, nowMs)}</Text>
      </View>

      <StopStrip names={visible.map((index) => names[index])} currentIndex={stripCurrent} />

      <View className="mt-5 gap-2 rounded-lg bg-surface p-4">
        <Text className="text-body-sm text-text-secondary">다음 역</Text>
        <Text className="text-headline-md font-sans-extrabold">{nameAt(nextVisible)}</Text>
        {upcoming ? (
          <Text className="text-body font-sans-bold text-primary">
            {upcomingMessage({ ...upcoming, stopsAway: upcomingAway }, nameAt(upcoming.index))}
          </Text>
        ) : null}
        {weakAcCars.length > 0 ? (
          <Text className="text-body-sm">
            약냉방칸 <Text className="font-sans-extrabold">{weakAcCars.join("·")}번째 칸</Text>
          </Text>
        ) : null}
        {doors.length > 0 ? (
          <Text className="text-body-sm">
            갈아타기 빠른 문 <Text className="font-sans-extrabold">{doors.map(describeDoor).join(", ")}</Text>
          </Text>
        ) : null}
      </View>

      {!guide.locationGranted ? (
        <Text className="mt-3 text-small text-text-secondary">
          위치 권한이 없어 시간표로 위치를 추정하고 있어요. 지금 있는 역을 눌러 알려 주면 더 정확해져요.
        </Text>
      ) : null}

      <View className="mt-5 gap-2.5">
        <Button
          label={nearEnd ? `${destination || "도착역"}에 도착했어요` : "지금 있는 역 알려주기"}
          onPress={nearEnd ? arrive : () => setPicking((value) => !value)}
          loading={createLog.isPending}
        />
        {createLog.error ? (
          <Text className="text-center text-body-sm text-error">이동 기록을 저장하지 못했어요. 다시 시도해 주세요.</Text>
        ) : null}
        {nearEnd ? (
          <Button label="아직 도착하지 않았어요" variant="ghost" onPress={() => setPicking((value) => !value)} />
        ) : null}
        <Button
          label="안내 종료"
          variant="ghost"
          onPress={() => navigation.navigate("MainTabs", { screen: "HomeTab" })}
        />
      </View>

      {picking ? (
        <View className="mt-2 border-t border-border">
          {visible.slice(0, -1).map((index) => (
            <Pressable
              key={`${stops[index].stationId}-${index}`}
              accessibilityRole="button"
              onPress={() => {
                guide.confirmStop(index);
                setPicking(false);
              }}
              className="flex-row justify-between py-3"
            >
              <Text
                className={cn("text-subtitle", index === visible[stripCurrent] ? "font-sans-extrabold" : "font-sans-medium", index < progress.currentIndex ? "text-text-secondary" : "text-text")}
              >
                {names[index]}
              </Text>
              {index === visible[stripCurrent] ? (
                <Text className="text-small text-primary">현재 추정</Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
