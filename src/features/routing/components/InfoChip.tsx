import React from "react";
import { View } from "react-native";
import { Text } from "@/common/components/Text";
import { cn } from "@/lib/cn";

interface InfoChipProps {
  label: string;
  /** 글자 앞에 오는 표시 (색 점이나 아이콘) */
  leading?: React.ReactNode;
  /** 추천 카드는 흰 배경, 나머지 카드는 surface 배경 */
  tone?: "bg" | "surface";
}

/** 경로 카드 아래의 작은 정보 칩 (혼잡도, 추천 탑승 칸, 별도 요금, 운행 상태) */
export function InfoChip({ label, leading, tone = "surface" }: InfoChipProps) {
  return (
    <View
      className={cn(
        "h-6.5 flex-row items-center gap-1.25 rounded-pill border border-border px-2.5",
        tone === "bg" ? "bg-bg" : "bg-surface"
      )}
    >
      {leading}
      <Text className="text-small font-sans-bold">{label}</Text>
    </View>
  );
}
