import React from "react";
import { Pressable, View } from "react-native";
import { DesignIcon } from "@/common/components/DesignIcon";
import { RiseIn } from "@/common/components/RiseIn";
import { Text } from "@/common/components/Text";
import { cn } from "@/lib/cn";

interface ArrivalPopupProps {
  title: string;
  detail?: string;
  /** 있으면 오른쪽에 "도착" 버튼이 보인다. 하차 1개 역 전과 도착했을 때만 준다 */
  onArrive?: () => void;
  loading?: boolean;
}

/** 하차나 환승 1개 역 전에 아래에서 올라오는 스마트 알림 (프로토타입의 pop: 아래에서 16px, 0.4초) */
export function ArrivalPopup({ title, detail, onArrive, loading = false }: ArrivalPopupProps) {
  return (
    <RiseIn from={16} durationMs={400}>
      <View
        accessibilityRole="alert"
        className="flex-row items-center gap-3 rounded-lg border-1.5 border-primary bg-bg py-3.5 pl-4 pr-3.5"
      >
        <View className="h-10 w-10 items-center justify-center rounded-pill bg-primary">
          <DesignIcon name="bell" size={20} tone="onPrimary" />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-subtitle font-sans-extrabold">{title}</Text>
          {detail ? <Text className="mt-0.5 text-body-sm text-text-secondary">{detail}</Text> : null}
        </View>
        {onArrive ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: loading }}
            disabled={loading}
            onPress={onArrive}
            className={cn("h-10 items-center justify-center rounded-sm-plus bg-primary-tint px-3", loading ? "opacity-50" : "")}
          >
            <Text className="text-body-sm font-sans-extrabold text-primary">도착</Text>
          </Pressable>
        ) : null}
      </View>
    </RiseIn>
  );
}
