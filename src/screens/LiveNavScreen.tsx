import React from "react";
import { View, Text } from "react-native";

export function LiveNavScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-950 p-4">
      <Text className="text-xl font-bold text-white">실시간 주행 안내 (Placeholder)</Text>
      <Text className="mt-2 text-sm text-slate-400">
        실시간 ETA, 환승/하차 1개 역 전 알림, 오탑승 감지 배너
      </Text>
    </View>
  );
}
