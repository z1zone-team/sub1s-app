import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStartTrackingMutation } from "@/apis/mutations/tracking/useStartTrackingMutation";
import { DesignIcon } from "@/common/components/DesignIcon";
import { RiseIn } from "@/common/components/RiseIn";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { OffRouteBanner } from "@/features/guide/components/OffRouteBanner";
import { RerouteCard } from "@/features/guide/components/RerouteCard";
import { useOffRouteStore } from "@/features/guide/offroute-store";
import type { RootStackParamList } from "@/navigation/navigation-types";

/** 프로토타입 OffRoute.dc.html의 경로 이탈 화면. 경고 배너, 새 경로 카드, 안내 박스, 두 버튼 */
export function OffRouteScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "OffRoute">) {
  const { alert, remainingSec } = route.params;
  const option = alert.rerouteOption;
  const insets = useSafeAreaInsets();
  const startTracking = useStartTrackingMutation();

  const startReroute = () => {
    if (startTracking.isPending) return;
    startTracking.mutate(
      { routeOption: option, stationIds: option.stationIds },
      {
        onSuccess: (session) => {
          useOffRouteStore.getState().reset();
          navigation.reset({
            index: 1,
            routes: [
              { name: "MainTabs" },
              {
                name: "LiveNav",
                params: { sessionId: session.sessionId, option, startedAtMs: Date.now() },
              },
            ],
          });
        },
      }
    );
  };

  const keepRoute = () => {
    useOffRouteStore.getState().dismiss();
    navigation.goBack();
  };

  // 새 경로는 이탈을 알아챈 역에서 시작하므로 그 역에서 내려 맞은편 열차를 타라고 안내한다
  const stationName = alert.detectedStationName;
  const message = stationName ? `${stationName}에서 내려 맞은편 열차를 타세요.` : alert.message;

  return (
    <Screen>
      <ScrollView className="flex-1" contentContainerClassName="gap-3 px-3 pb-4 pt-2">
        <OffRouteBanner message={message} />
        <RerouteCard option={option} detectedStationName={stationName} previousRemainingSec={remainingSec} />
        <RiseIn from={24} durationMs={400} delayMs={200}>
          <View className="rounded-lg bg-error-tint px-4 py-3.5">
            <Text className="text-body-sm">
              잘못 탄 게 아니라면 <Text className="text-body-sm font-sans-bold">맞게 탔어요</Text>를 눌러 주세요. 다음 역 정차 정보로 다시
              확인할게요.
            </Text>
          </View>
        </RiseIn>
        {startTracking.error ? (
          <Text className="text-center text-body-sm text-error">새 경로를 시작하지 못했어요. 다시 시도해 주세요.</Text>
        ) : null}
      </ScrollView>

      <View style={{ paddingBottom: Math.max(insets.bottom, 12) + 10 }} className="gap-2 px-5">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: startTracking.isPending }}
          disabled={startTracking.isPending}
          onPress={startReroute}
          className="h-14 flex-row items-center justify-center gap-2 rounded-md bg-primary"
        >
          <DesignIcon name="navigate" size={18} tone="onPrimary" />
          <Text className="text-base font-sans-bold text-on-primary">새 경로로 안내</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={keepRoute}
          className="h-13 items-center justify-center rounded-md border border-border bg-bg"
        >
          <Text className="text-subtitle font-sans-semibold">맞게 탔어요</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
