import React from "react";
import { Pressable, View } from "react-native";
import type { SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { Text } from "@/common/components/Text";
import { formatDurationSec } from "@/common/utils/format";
import type { RouteGroup } from "@/features/routing/routeView";
import { segmentShares } from "@/features/routing/routeView";
import { getLineInfo, lineTextColor, WALK_LINE_ID } from "@/theme";
import { cn } from "@/lib/cn";
import { arrivalText, summarizeRoute, transferAndWalkText } from "../searchLogic";

const MIN_SHARE = 0.04;

interface RecommendedRoutesProps {
  originName: string;
  destinationName: string;
  groups: RouteGroup[];
  onPress: (group: RouteGroup) => void;
}

/** 구간 막대. 프로토타입처럼 높이 8px, 폭은 소요 시간 비례이고 도보는 테두리색이다 */
function MiniSegmentBar({ option }: { option: SubwayRouteOptionDto }) {
  const shares = segmentShares(option);
  return (
    <View className="mt-3.5 h-2 flex-row gap-0.75">
      {option.segments.map((segment, index) => {
        const isWalk = segment.lineId === WALK_LINE_ID;
        return (
          <View
            key={`${segment.lineId}-${index}`}
            className={cn("rounded-pill", isWalk ? "bg-border" : "")}
            style={{
              flex: Math.max(shares[index], MIN_SHARE),
              ...(isWalk ? null : { backgroundColor: getLineInfo(segment.lineId).color }),
            }}
          />
        );
      })}
    </View>
  );
}

/** "9 급행"처럼 호선 번호와 급행 표시가 한 알약에 들어간다. 노선마다 색이 달라 style로 준다 */
function RideBadge({ lineId, express }: { lineId: string; express: boolean }) {
  const line = getLineInfo(lineId);
  const label = express ? `${line.shortLabel} 급행` : line.shortLabel;
  return (
    <View
      accessibilityLabel={line.name}
      className="h-5 min-w-5 items-center justify-center rounded-pill px-1.5"
      style={{ backgroundColor: line.color }}
    >
      <Text className="text-tiny font-sans-extrabold" style={{ color: lineTextColor(line.color) }}>
        {label}
      </Text>
    </View>
  );
}

function RouteSummary({ option }: { option: SubwayRouteOptionDto }) {
  const { rides, walkTo } = summarizeRoute(option);
  const single = rides.length === 1;
  return (
    <View className="mt-3 flex-row flex-wrap items-center gap-1.5">
      {rides.map((ride, index) => (
        <View key={`${ride.lineId}-${index}`} className="flex-row items-center gap-1.5">
          <RideBadge lineId={ride.lineId} express={ride.isExpress} />
          <Text className="text-body-sm font-sans-semibold">{single ? `${ride.from} → ${ride.to}` : ride.to}</Text>
        </View>
      ))}
      {walkTo ? <Text className="text-body-sm font-sans-medium text-text-secondary">· 도보 {walkTo}</Text> : null}
    </View>
  );
}

/** 프로토타입 Search 하단의 "추천 경로". 가장 최근 도착지까지의 최적과 여유 경로를 카드로 보여 준다 */
export function RecommendedRoutes({ originName, destinationName, groups, onPress }: RecommendedRoutesProps) {
  if (groups.length === 0) return null;

  return (
    <View>
      <View className="flex-row items-baseline justify-between px-5 pb-3 pt-8">
        <Text className="text-title font-sans-bold">추천 경로</Text>
        <Text numberOfLines={1} className="shrink text-body-sm text-text-secondary">
          {originName} → {destinationName}
        </Text>
      </View>
      <View className="gap-3 px-4">
        {groups.map((group, index) => {
          const { option } = group;
          const primary = index === 0;
          return (
            <Pressable
              key={option.estimatedArrivalTimestamp + group.title}
              accessibilityRole="button"
              onPress={() => onPress(group)}
              className={cn("rounded-lg border p-4.5", primary ? "border-text" : "border-border")}
            >
              <View className="flex-row items-center gap-2">
                <Text
                  className={cn(
                    "h-6 overflow-hidden rounded-pill px-2.5 text-center text-small font-sans-bold leading-6",
                    primary ? "bg-primary text-on-primary" : "border border-text"
                  )}
                >
                  {group.title}
                </Text>
                <Text numberOfLines={1} className="shrink text-body-sm text-text-secondary">
                  {primary ? transferAndWalkText(option) : `환승 ${option.transferCount}회${group.tagline ? ` · ${group.tagline}` : ""}`}
                </Text>
              </View>
              <View className="mt-2.5 flex-row items-baseline gap-2">
                <Text className="text-display font-sans-extrabold">{formatDurationSec(option.totalDurationSec)}</Text>
                <Text className="text-body text-text-secondary">{arrivalText(option)}</Text>
              </View>
              <MiniSegmentBar option={option} />
              <RouteSummary option={option} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
