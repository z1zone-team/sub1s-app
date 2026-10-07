import React from "react";
import { View, Text } from "react-native";

export function RouteResultScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-950 p-4">
      <Text className="text-xl font-bold text-white">경로 탐색 결과 (Placeholder)</Text>
      <Text className="mt-2 text-sm text-slate-400">
        최적/여유/취향/최소비용 4-모드 추천 카드 및 칸별 혼잡도
      </Text>
    </View>
  );
}
