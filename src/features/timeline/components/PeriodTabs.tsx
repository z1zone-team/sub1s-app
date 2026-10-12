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

/** 주, 월, 년, 전체를 고르는 4칸 알약 선택기. 고른 칸만 primary 색이다 */
export function PeriodTabs({ value, onChange }: PeriodTabsProps) {
  return (
    <View className="flex-row rounded-pill bg-surface p-1">
      {PERIODS.map((item) => {
        const selected = item.value === value;
        return (
          <Pressable
            key={item.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(item.value)}
            className={cn("h-9 flex-1 items-center justify-center rounded-pill", selected ? "bg-primary" : "")}
          >
            <Text className={cn("text-body font-sans-bold", selected ? "text-on-primary" : "text-text-secondary")}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
