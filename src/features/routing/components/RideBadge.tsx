import React from "react";
import { View } from "react-native";
import { Text } from "@/common/components/Text";
import { getLineInfo, lineTextColor } from "@/theme";
import { cn } from "@/lib/cn";

interface RideBadgeProps {
  lineId: string;
  /** "9 급행", "9 일반"처럼 호선 번호 뒤에 붙는 열차 종류. 같은 알약 안에 들어간다 */
  kind?: string;
  /** sm 20px(검색의 추천 경로), md 22px(경로 목록 카드) */
  size?: "sm" | "md";
  /** 번호 대신 "9호선"처럼 전체 이름을 쓴다 (경로 상세의 승차 행) */
  full?: boolean;
}

/** 호선 번호와 열차 종류가 한 알약에 들어가는 배지. 노선마다 색이 달라 style로 준다 */
export function RideBadge({ lineId, kind, size = "sm", full = false }: RideBadgeProps) {
  const line = getLineInfo(lineId);
  const base = full ? line.name : line.shortLabel;
  const label = kind ? `${base} ${kind}` : base;
  return (
    <View
      accessibilityLabel={`${line.name}${kind ? ` ${kind}` : ""}`}
      className={cn(
        "min-w-5 items-center justify-center rounded-pill",
        size === "md" ? "h-5.5 px-1.75" : "h-5 px-1.5"
      )}
      style={{ backgroundColor: line.color }}
    >
      <Text
        className={cn("font-sans-bold", size === "md" ? "text-caption" : "text-tiny")}
        style={{ color: lineTextColor(line.color) }}
      >
        {label}
      </Text>
    </View>
  );
}
