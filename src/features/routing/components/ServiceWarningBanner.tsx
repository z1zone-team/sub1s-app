import React from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/common/components/Text";
import type { ServiceWarningView } from "../serviceWarningView";

interface ServiceWarningBannerProps {
  view: ServiceWarningView;
  onRetry: (departureMs: number) => void;
}

/** 경로의 탑승역에 탈 열차가 없을 때 목록 위에 보이는 안내. 다음 첫차에 맞춘 출발 시각으로 다시 찾을 수 있다 */
export function ServiceWarningBanner({ view, onRetry }: ServiceWarningBannerProps) {
  const { retry } = view;
  return (
    <View accessibilityRole="alert" className="mb-1 gap-2 rounded-lg border border-border bg-bg p-4">
      <View className="flex-row items-center gap-2">
        <View className="h-2 w-2 rounded-pill bg-error" />
        <Text className="shrink text-subtitle font-sans-bold">{view.title}</Text>
      </View>
      <Text className="text-body text-text-secondary">{view.detail}</Text>
      {retry ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onRetry(retry.departureMs)}
          className="h-11 items-center justify-center rounded-md-plus bg-primary"
        >
          <Text className="text-body font-sans-bold text-on-primary">{retry.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
