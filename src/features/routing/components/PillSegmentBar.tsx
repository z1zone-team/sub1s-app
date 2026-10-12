import React from "react";
import { View } from "react-native";
import type { SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { DesignIcon } from "@/common/components/DesignIcon";
import { Text } from "@/common/components/Text";
import { getLineInfo, lineTextColor } from "@/theme";
import { cn } from "@/lib/cn";
import { pillSegments } from "../routeCardView";

interface PillSegmentBarProps {
  option: SubwayRouteOptionDto;
  /** 추천 카드는 흰 배경, 나머지 카드는 surface 배경 */
  tone?: "bg" | "surface";
}

/**
 * 프로토타입의 구간 막대. 높이 24px 알약 안에 탑승 구간은 호선 색 알약으로, 도보는 글자만 놓는다.
 * 첫 도보 앞에는 걷는 아이콘이 붙는다. 폭과 호선 색은 값마다 달라 style로 준다
 */
export function PillSegmentBar({ option, tone = "surface" }: PillSegmentBarProps) {
  const parts = pillSegments(option);

  return (
    <View
      className={cn("mt-3.5 h-6 flex-row items-center overflow-hidden rounded-pill", tone === "bg" ? "bg-bg" : "bg-surface")}
    >
      {parts.map((part, index) =>
        part.isWalk ? (
          <View
            key={part.key}
            className="h-6 flex-row items-center justify-center gap-0.5 px-1"
            style={{ flex: part.flex, minWidth: index === 0 ? 34 : 24 }}
          >
            {index === 0 ? <DesignIcon name="walk" size={12} tone="secondary" /> : null}
            <Text numberOfLines={1} className="text-caption font-sans-bold text-text-secondary">
              {part.label}
            </Text>
          </View>
        ) : (
          <View
            key={part.key}
            className="h-6 items-center justify-center rounded-pill"
            style={{ flex: part.flex, minWidth: 30, backgroundColor: getLineInfo(part.lineId).color }}
          >
            <Text
              numberOfLines={1}
              className="text-caption font-sans-bold"
              style={{ color: lineTextColor(getLineInfo(part.lineId).color) }}
            >
              {part.label}
            </Text>
          </View>
        )
      )}
    </View>
  );
}
