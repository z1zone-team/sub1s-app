import React from "react";
import { View, Text } from "react-native";

export function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-950 p-4">
      <Text className="text-xl font-bold text-white">홈 화면 (Placeholder)</Text>
      <Text className="mt-2 text-sm text-slate-400">
        4-모드 경로 검색, V-World 지도, 플로팅 음성 마이크
      </Text>
    </View>
  );
}
