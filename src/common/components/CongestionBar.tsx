import React from "react";
import { Text, View } from "react-native";
import { congestionColor, levelOfRate, useTheme } from "@/theme";

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

/** 1~10번 칸의 혼잡도를 막대로 보여 주고 추천 칸과 약냉방칸을 표시한다 */
export function CongestionBar({
  cars,
  recommendedCarNo,
  weakAcCarNos = [],
}: CongestionBarProps) {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4 }}>
      {cars.map((car) => {
        const rate = Math.min(Math.max(car.rate, 0), 100);
        const recommended = car.carNo === recommendedCarNo;
        const weakAc = weakAcCarNos.includes(car.carNo);
        return (
          <View key={car.carNo} style={{ flex: 1, alignItems: "center", gap: 4 }}>
            <View
              accessibilityLabel={`${car.carNo}번째 칸 혼잡도 ${Math.round(rate)}%`}
              style={{
                width: "100%",
                height: MIN_HEIGHT + ((MAX_HEIGHT - MIN_HEIGHT) * rate) / 100,
                borderRadius: 4,
                backgroundColor: congestionColor(levelOfRate(rate), colors),
                borderWidth: recommended ? 2 : 0,
                borderColor: colors.primary,
              }}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: recommended ? "800" : "500",
                color: recommended ? colors.primary : colors.textSecondary,
              }}
            >
              {car.carNo}
            </Text>
            <Text style={{ fontSize: 10, color: colors.textSecondary, height: 12 }}>
              {recommended ? "추천" : weakAc ? "약냉" : ""}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
