import React from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/common/components/Text";
import type { TravelStatsPeriod } from "@/apis/queries/profile/getTravelStats";
import { cn } from "@/lib/cn";
import { PERIODS } from "../timelineView";

interface PeriodTabsProps {
  value: TravelStatsPeriod;
  onChange: (period: TravelStatsPeriod) => void;
}

/** 프로토타입의 활성 칸: 흰 배경 위에 옅은 이중 그림자(0 1 2 / 0.06, 0 1 1 / 0.04). 안드로이드는 elevation으로 근사한다 */
const ACTIVE_SHADOW = {
  shadowColor: "#001A45",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 2,
  elevation: 1,
} as const;

/** 주, 월, 년, 전체를 고르는 4칸 선택기. 면 색 판 위에서 고른 칸만 흰 배경과 글자색으로 떠 보인다 */
export function PeriodTabs({ value, onChange }: PeriodTabsProps) {
  return (
    <View className="flex-row rounded-md bg-surface p-1">
      {PERIODS.map((item) => {
        const selected = item.value === value;
        return (
          <Pressable
            key={item.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(item.value)}
            className={cn("h-control flex-1 items-center justify-center rounded-sm-plus", selected ? "bg-bg" : "")}
            style={selected ? ACTIVE_SHADOW : undefined}
          >
            <Text className={cn("text-body font-sans-semibold", selected ? "text-text" : "text-text-secondary")}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
