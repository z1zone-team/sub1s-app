import React from "react";
import { View } from "react-native";
import type { SegmentCar } from "@/apis/queries/routing/searchRoutes";
import { Text } from "@/common/components/Text";
import { congestionColor, levelOfRate, useTheme } from "@/theme";
import { cn } from "@/lib/cn";
import { carInsight } from "../routeView";

interface CarCongestionCardProps {
  cars: SegmentCar[];
  recommendedCarNo: number;
  /** "14:19 기준"처럼 예측이 어느 시각인지 */
  forecastLabel: string;
}

const LEGEND = [
  { level: "여유", label: "여유" },
  { level: "보통", label: "보통" },
  { level: "혼잡", label: "혼잡" },
] as const;

/**
 * 프로토타입의 "칸별 혼잡도" 카드. 1~10번 칸을 네모 안에 아래에서 차오르는 막대로 보여 주고,
 * 추천 칸은 primary 테두리와 "추천", 약냉방칸은 "약냉"으로 표시한다. 막대 높이와 색은 값마다 달라 style로 준다
 */
export function CarCongestionCard({ cars, recommendedCarNo, forecastLabel }: CarCongestionCardProps) {
  const { colors } = useTheme();
  const insight = carInsight(cars, recommendedCarNo);

  return (
    <View className="mt-3 rounded-md border border-border px-3 pb-2.5 pt-3.5">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-body font-sans-bold">칸별 혼잡도</Text>
        <Text className="text-caption text-text-secondary">{forecastLabel}</Text>
      </View>
      {insight?.betterThanAveragePercent ? (
        <Text className="mt-1 text-body-sm text-text-secondary">
          <Text className="text-body-sm font-sans-bold text-primary">{recommendedCarNo}번째 칸</Text>이 평균보다{" "}
          {insight.betterThanAveragePercent}% 한산해요
        </Text>
      ) : null}

      <View className="mt-3 flex-row gap-1">
        {cars.map((car) => {
          const rate = Math.min(Math.max(car.rate, 0), 100);
          const recommended = car.carNo === recommendedCarNo;
          return (
            <View key={car.carNo} className="flex-1 items-center gap-1">
              <View
                accessibilityLabel={`${car.carNo}번째 칸 혼잡도 ${Math.round(rate)}%`}
                className={cn(
                  "h-8.5 w-full justify-end overflow-hidden rounded-xs-plus bg-bg",
                  recommended ? "border-2 border-primary" : "border border-border"
                )}
              >
                <View
                  style={{
                    height: `${rate}%`,
                    backgroundColor: congestionColor(levelOfRate(rate), colors),
                    opacity: 0.85,
                  }}
                />
              </View>
              <Text
                className={cn(
                  "text-tiny",
                  recommended ? "font-sans-bold text-primary" : "font-sans-semibold text-text-secondary"
                )}
              >
                {car.carNo}
              </Text>
              <Text
                className={cn(
                  "h-3 text-micro",
                  recommended ? "font-sans-bold text-primary" : "font-sans-bold text-accent"
                )}
              >
                {recommended ? "추천" : car.isWeakAirConditioned ? "약냉" : ""}
              </Text>
            </View>
          );
        })}
      </View>

      <View className="mt-2 flex-row gap-3">
        {LEGEND.map((item) => (
          <View key={item.level} className="flex-row items-center gap-1">
            <View className="h-2 w-2 rounded-3xs" style={{ backgroundColor: congestionColor(item.level, colors) }} />
            <Text className="text-caption text-text-secondary">{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
