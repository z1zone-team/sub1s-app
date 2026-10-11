import React from "react";
import { Pressable, View } from "react-native";
import type { PathSegmentDto } from "@/apis/queries/routing/searchRoutes";
import { LineBadge } from "@/common/components/LineBadge";
import { Text } from "@/common/components/Text";
import { formatDurationSec, formatFare } from "@/common/utils/format";
import { CONGESTION_TEXT, WALK_LINE_ID } from "@/theme";
import {
  MODE_TITLE,
  clockRange,
  operationLabel,
  walkSeconds,
  type RouteGroup,
} from "../routeView";
import { SegmentBar } from "./SegmentBar";
import { cn } from "@/lib/cn";

interface RouteCardProps {
  group: RouteGroup;
  onPress: () => void;
}

export function RouteCard({ group, onPress }: RouteCardProps) {
  const { option } = group;
  const rides = option.segments.filter((segment) => segment.lineId !== WALK_LINE_ID);
  const walk = walkSeconds(option);
  const operation = operationLabel(option.operationStatus, option.operationNotice);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={cn("mx-4 mb-3 gap-3 rounded-lg bg-bg p-4", group.recommended ? "border-2 border-primary" : "border border-border")}
    >
      <View className="flex-row flex-wrap items-center gap-1.5">
        <Text
          className={cn("overflow-hidden rounded-pill px-2.5 py-0.75 text-small font-sans-extrabold", group.recommended ? "bg-primary text-on-primary" : "bg-primary-tint text-primary")}
        >
          {group.title}
        </Text>
        {group.modes.slice(1).map((mode) => (
          <Text key={mode} className="text-small text-text-secondary">
            {MODE_TITLE[mode]}
          </Text>
        ))}
      </View>
      {group.tagline ? <Text className="text-body-sm text-text-secondary">{group.tagline}</Text> : null}

      <View className="flex-row items-baseline justify-between">
        <Text className="text-display-sm font-sans-extrabold">
          {formatDurationSec(option.totalDurationSec)}
        </Text>
        <Text className="text-base font-sans-bold">{formatFare(option.totalFare)}</Text>
      </View>
      <Text className="text-body-sm text-text-secondary">
        {[
          clockRange(option),
          `환승 ${option.transferCount}회`,
          walk > 0 ? `도보 ${formatDurationSec(walk)}` : "",
        ]
          .filter(Boolean)
          .join(" · ")}
      </Text>

      <SegmentBar option={option} />

      <View className="gap-1.5">
        {rides.map((segment, index) => (
          <RideLine key={`${segment.lineId}-${index}`} segment={segment} />
        ))}
      </View>

      {operation ? (
        <Text
          className={cn("text-small font-sans-semibold", operation.tone === "warning" ? "text-error" : "text-success")}
        >
          {operation.text}
        </Text>
      ) : null}
    </Pressable>
  );
}

function RideLine({ segment }: { segment: PathSegmentDto }) {
  return (
    <View className="flex-row items-center gap-2">
      <LineBadge lineId={segment.lineId} suffix={segment.isExpress ? "급행" : undefined} size="sm" />
      <Text numberOfLines={1} className="flex-1 text-body-sm">
        {segment.fromStationName} → {segment.toStationName}
      </Text>
      <Text className={cn("text-small font-sans-semibold", CONGESTION_TEXT[segment.congestionLevel])}>
        {segment.congestionLevel} {Math.round(segment.congestionRate)}%
      </Text>
    </View>
  );
}
