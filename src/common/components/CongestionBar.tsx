import React from "react";
import { View } from "react-native";
import { CONGESTION_BG, levelOfRate } from "@/theme";
import { Text } from "./Text";
import { cn } from "@/lib/cn";

export interface CarCongestion {
  carNo: number;
  /** 0~100 */
  rate: number;
}

interface CongestionBarProps {
  cars: CarCongestion[];
  recommendedCarNo?: number;
  /** 약냉방칸 번호. 막대 아래에 "약냉" 표시를 붙인다 */
  weakAcCarNos?: number[];
}

const MAX_HEIGHT = 56;
const MIN_HEIGHT = 8;

/** 1~10번 칸의 혼잡도를 막대로 보여 주고 추천 칸과 약냉방칸을 표시한다. 막대 높이는 값마다 달라 style로 준다 */
export function CongestionBar({
  cars,
  recommendedCarNo,
  weakAcCarNos = [],
}: CongestionBarProps) {
  return (
    <View className="flex-row items-end gap-1">
      {cars.map((car) => {
        const rate = Math.min(Math.max(car.rate, 0), 100);
        const recommended = car.carNo === recommendedCarNo;
        const weakAc = weakAcCarNos.includes(car.carNo);
        return (
          <View key={car.carNo} className="flex-1 items-center gap-1">
            <View
              accessibilityLabel={`${car.carNo}번째 칸 혼잡도 ${Math.round(rate)}%`}
              className={cn("w-full rounded-xs", CONGESTION_BG[levelOfRate(rate)], recommended ? "border-2 border-primary" : "")}
              style={{ height: MIN_HEIGHT + ((MAX_HEIGHT - MIN_HEIGHT) * rate) / 100 }}
            />
            <Text
              className={cn("text-caption", recommended ? "font-sans-extrabold text-primary" : "font-sans-medium text-text-secondary")}
            >
              {car.carNo}
            </Text>
            <Text className="h-3 text-tiny text-text-secondary">
              {recommended ? "추천" : weakAc ? "약냉" : ""}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
