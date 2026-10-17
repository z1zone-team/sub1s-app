import React from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { DesignIcon } from "@/common/components/DesignIcon";
import { Text } from "@/common/components/Text";
import { useTheme } from "@/theme";

interface PickStatusCardProps {
  /** 없으면 주소를 찾는 중이다 */
  errorMessage?: string;
  onClose: () => void;
}

/** 지도를 길게 눌러 고른 곳의 주소를 찾는 동안과 실패했을 때의 하단 카드. 성공하면 PlaceCard로 바뀐다 */
export function PickStatusCard({ errorMessage, onClose }: PickStatusCardProps) {
  const { colors } = useTheme();
  return (
    <View className="absolute inset-x-0 bottom-0 rounded-t-xl border-t border-border bg-bg px-5 pb-5 pt-5">
      <View className="flex-row items-center gap-3">
        {errorMessage ? null : <ActivityIndicator color={colors.primary} />}
        <Text className={errorMessage ? "flex-1 text-body text-error" : "flex-1 text-body font-sans-semibold"}>
          {errorMessage ?? "주소를 찾는 중이에요"}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="닫기"
          onPress={onClose}
          className="-mr-3 h-control w-control items-center justify-center"
        >
          <DesignIcon name="close" size={18} tone="secondary" />
        </Pressable>
      </View>
    </View>
  );
}
