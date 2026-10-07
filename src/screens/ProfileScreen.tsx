import React from "react";
import { View, Text } from "react-native";

export function ProfileScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-950 p-4">
      <Text className="text-xl font-bold text-white">프로필 화면 (Placeholder)</Text>
      <Text className="mt-2 text-sm text-slate-400">
        주/월/년 통계, 호선별 노선도, 타임라인 진입
      </Text>
    </View>
  );
}
