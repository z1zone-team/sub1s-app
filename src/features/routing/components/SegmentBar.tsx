import React from "react";
import { Text, View } from "react-native";
import type { SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { formatDurationSec } from "@/common/utils/format";
import { getLineInfo, useTheme, WALK_LINE_ID } from "@/theme";
import { segmentShares } from "../routeView";

const MIN_SHARE = 0.06;

/** 경로를 구간별로 나눈 가로 막대. 폭은 소요 시간에 비례하고 색은 호선 색이며 도보는 회색이다 */
export function SegmentBar({ option }: { option: SubwayRouteOptionDto }) {
  const { colors } = useTheme();
  const shares = segmentShares(option);

  return (
    <View style={{ flexDirection: "row", height: 22, borderRadius: 6, overflow: "hidden", gap: 2 }}>
      {option.segments.map((segment, index) => {
        const isWalk = segment.lineId === WALK_LINE_ID;
        const color = isWalk ? colors.border : getLineInfo(segment.lineId).color;
        const wide = shares[index] > 0.14;
        return (
          <View
            key={`${segment.lineId}-${index}`}
            style={{
              flex: Math.max(shares[index], MIN_SHARE),
              backgroundColor: color,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {wide ? (
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: isWalk ? colors.textSecondary : "#FFFFFF",
                }}
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
