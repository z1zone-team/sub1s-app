import React from "react";
import { Pressable, Text, View } from "react-native";
import type { PathSegmentDto } from "@/apis/queries/routing/searchRoutes";
import { LineBadge } from "@/common/components/LineBadge";
import { formatDurationSec, formatFare } from "@/common/utils/format";
import { congestionColor, useTheme, WALK_LINE_ID } from "@/theme";
import {
  MODE_TITLE,
  clockRange,
  operationLabel,
  walkSeconds,
  type RouteGroup,
} from "../routeView";
import { SegmentBar } from "./SegmentBar";

interface RouteCardProps {
  group: RouteGroup;
  onPress: () => void;
}

export function RouteCard({ group, onPress }: RouteCardProps) {
  const { colors } = useTheme();
  const { option } = group;
  const rides = option.segments.filter((segment) => segment.lineId !== WALK_LINE_ID);
  const walk = walkSeconds(option);
  const operation = operationLabel(option.operationStatus, option.operationNotice);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 16,
        gap: 12,
        borderRadius: 16,
        borderWidth: group.recommended ? 2 : 1,
        borderColor: group.recommended ? colors.primary : colors.border,
        backgroundColor: colors.bg,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <Text
          style={{
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 999,
            overflow: "hidden",
            fontSize: 12,
            fontWeight: "800",
            color: group.recommended ? colors.onPrimary : colors.primary,
            backgroundColor: group.recommended ? colors.primary : colors.primaryTint,
          }}
        >
          {group.title}
        </Text>
        {group.modes.slice(1).map((mode) => (
          <Text key={mode} style={{ fontSize: 12, color: colors.textSecondary }}>
            {MODE_TITLE[mode]}
          </Text>
        ))}
      </View>
      {group.tagline ? (
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>{group.tagline}</Text>
      ) : null}

      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text }}>
          {formatDurationSec(option.totalDurationSec)}
        </Text>
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
          {formatFare(option.totalFare)}
        </Text>
      </View>
      <Text style={{ fontSize: 13, color: colors.textSecondary }}>
        {[
          clockRange(option),
          `환승 ${option.transferCount}회`,
          walk > 0 ? `도보 ${formatDurationSec(walk)}` : "",
        ]
          .filter(Boolean)
          .join(" · ")}
      </Text>

      <SegmentBar option={option} />

      <View style={{ gap: 6 }}>
        {rides.map((segment, index) => (
          <RideLine key={`${segment.lineId}-${index}`} segment={segment} />
        ))}
      </View>

      {operation ? (
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: operation.tone === "warning" ? colors.error : colors.success,
          }}
        >
          {operation.text}
        </Text>
      ) : null}
    </Pressable>
  );
}

function RideLine({ segment }: { segment: PathSegmentDto }) {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <LineBadge lineId={segment.lineId} suffix={segment.isExpress ? "급행" : undefined} size="sm" />
      <Text numberOfLines={1} style={{ flex: 1, fontSize: 13, color: colors.text }}>
        {segment.fromStationName} → {segment.toStationName}
      </Text>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: congestionColor(segment.congestionLevel, colors),
        }}
      >
        {segment.congestionLevel} {Math.round(segment.congestionRate)}%
      </Text>
    </View>
  );
}
