import React from "react";
import { Text, View } from "react-native";
import { getLineInfo, lineTextColor } from "@/theme";

interface LineBadgeProps {
  lineId: string;
  /** "급행"처럼 배지 옆에 붙는 짧은 표시 */
  suffix?: string;
  size?: "sm" | "md";
}

const SIZE = {
  sm: { height: 20, font: 11, minWidth: 20, padding: 6 },
  md: { height: 24, font: 12, minWidth: 24, padding: 8 },
} as const;

/** 한 글자 숫자 호선은 동그랗게, 글자가 긴 노선은 알약 모양으로 보여 준다 */
export function LineBadge({ lineId, suffix, size = "md" }: LineBadgeProps) {
  const line = getLineInfo(lineId);
  const dimension = SIZE[size];
  const isRound = line.shortLabel.length === 1;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <View
        accessibilityLabel={line.name}
        style={{
          height: dimension.height,
          minWidth: dimension.minWidth,
          paddingHorizontal: isRound ? 0 : dimension.padding,
          borderRadius: 999,
          backgroundColor: line.color,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontSize: dimension.font,
            fontWeight: "800",
            color: lineTextColor(line.color),
          }}
        >
          {line.shortLabel}
        </Text>
      </View>
      {suffix ? (
        <Text style={{ fontSize: dimension.font, fontWeight: "700" }}>{suffix}</Text>
      ) : null}
    </View>
  );
}
