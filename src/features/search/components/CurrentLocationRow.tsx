import React from "react";
import { Pressable, View } from "react-native";
import { DesignIcon } from "@/common/components/DesignIcon";
import { Text } from "@/common/components/Text";
import { cn } from "@/lib/cn";

export type CurrentLocationStatus = "READY" | "LOCATING" | "DENIED";

interface CurrentLocationRowProps {
  status: CurrentLocationStatus;
  /** 지금 출발지가 이미 현재 위치를 따라가고 있는지 */
  selected: boolean;
  onPress: () => void;
}

const SUBTITLE: Record<CurrentLocationStatus, string> = {
  READY: "지금 있는 곳에서 출발해요",
  LOCATING: "위치를 확인하고 있어요",
  DENIED: "위치 권한이 없어 쓸 수 없어요",
};

/** 출발지를 입력할 때 후보 맨 위에 두는 "현재 위치" 행. 누르면 출발지가 다시 현재 위치를 따라간다 */
export function CurrentLocationRow({ status, selected, onPress }: CurrentLocationRowProps) {
  const disabled = status === "DENIED";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="현재 위치를 출발지로"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      className={cn("h-16 flex-row items-center gap-3 border-b border-border px-5", disabled ? "opacity-50" : "")}
    >
      <View className="h-10 w-10 items-center justify-center rounded-pill bg-primary-tint">
        <DesignIcon name="locate" size={20} tone="primary" />
      </View>
      <View className="flex-1">
        <Text className="text-subtitle font-sans-bold">현재 위치</Text>
        <Text numberOfLines={1} className="text-body-sm text-text-secondary">
          {SUBTITLE[status]}
        </Text>
      </View>
      {selected ? <DesignIcon name="check" size={18} tone="primary" /> : null}
    </Pressable>
  );
}
