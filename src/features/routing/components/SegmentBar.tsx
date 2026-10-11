import React from "react";
import { View } from "react-native";
import type { SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { Text } from "@/common/components/Text";
import { formatDurationSec } from "@/common/utils/format";
import { getLineInfo, WALK_LINE_ID } from "@/theme";
import { segmentShares } from "../routeView";
import { cn } from "@/lib/cn";

const MIN_SHARE = 0.06;

/** 경로를 구간별로 나눈 가로 막대. 폭은 소요 시간에 비례하고 색은 호선 색이며 도보는 회색이다. 폭과 호선 색은 값마다 달라 style로 준다 */
export function SegmentBar({ option }: { option: SubwayRouteOptionDto }) {
  const shares = segmentShares(option);

  return (
    <View className="h-5.5 flex-row gap-0.5 overflow-hidden rounded-xs-plus">
      {option.segments.map((segment, index) => {
        const isWalk = segment.lineId === WALK_LINE_ID;
        const wide = shares[index] > 0.14;
        return (
          <View
            key={`${segment.lineId}-${index}`}
            className={cn("items-center justify-center", isWalk ? "bg-border" : "")}
            style={{
              flex: Math.max(shares[index], MIN_SHARE),
              ...(isWalk ? null : { backgroundColor: getLineInfo(segment.lineId).color }),
            }}
          >
            {wide ? (
              <Text
                className={cn("text-caption font-sans-bold", isWalk ? "text-text-secondary" : "text-white")}
              >
                {formatDurationSec(segment.durationSec)}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
