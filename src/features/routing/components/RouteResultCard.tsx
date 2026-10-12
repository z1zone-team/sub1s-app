import React from "react";
import { Pressable, View } from "react-native";
import type { SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { DesignIcon } from "@/common/components/DesignIcon";
import { Text } from "@/common/components/Text";
import { formatDurationSec, formatFare } from "@/common/utils/format";
import { CONGESTION_BG, useTheme, WALK_LINE_ID } from "@/theme";
import { cn } from "@/lib/cn";
import {
  alightInfo,
  firstRideCars,
  overallCongestion,
  separateFareLineNames,
  splitDuration,
} from "../routeCardView";
import { clockRange, operationLabel, walkSeconds, type RouteGroup } from "../routeView";
import { InfoChip } from "./InfoChip";
import { PillSegmentBar } from "./PillSegmentBar";
import { RideBadge } from "./RideBadge";

export interface BoardingInfo {
  /** "2분 후" */
  waiting: string;
  /** 행선지 */
  headsign: string;
}

interface RouteResultCardProps {
  group: RouteGroup;
  /** 추천 카드에서 첫 탑승역의 다음 열차. 모르면 열차 줄만 줄어든다 */
  boarding?: BoardingInfo;
  onPress: () => void;
}

function Duration({ seconds, large }: { seconds: number; large: boolean }) {
  const { hours, minutes } = splitDuration(seconds);
  const number = large ? "text-display-lg" : "text-display";
  const unit = large ? "text-base" : "text-subtitle";
  return (
    <View className="flex-row items-baseline gap-0.5">
      {hours > 0 ? (
        <>
          <Text className={cn(number, "font-sans-extrabold")}>{hours}</Text>
          <Text className={cn(unit, "mr-1 font-sans-bold")}>시간</Text>
        </>
      ) : null}
      {minutes > 0 || hours === 0 ? (
        <>
          <Text className={cn(number, "font-sans-extrabold")}>{minutes}</Text>
          <Text className={cn(unit, "font-sans-bold")}>분</Text>
        </>
      ) : null}
    </View>
  );
}

/** 추천 카드의 탑승 안내 세 줄 (열차, 추천 칸, 하차). 프로토타입 Route.dc.html의 추천 카드 */
function BoardingDetails({ option, boarding }: { option: SubwayRouteOptionDto; boarding?: BoardingInfo }) {
  const ride = option.segments.find((segment) => segment.lineId !== WALK_LINE_ID);
  const cars = firstRideCars(option);
  const alight = alightInfo(option);
  if (!ride) return null;

  return (
    <View className="mt-3.5 gap-2">
      <View className="flex-row items-center gap-2">
        <RideBadge lineId={ride.lineId} kind={ride.isExpress ? "급행" : undefined} size="md" />
        <Text className="text-body font-sans-bold">{ride.fromStationName}</Text>
        {boarding && (boarding.waiting || boarding.headsign) ? (
          <Text numberOfLines={1} className="shrink text-body text-text-secondary">
            {[boarding.waiting, boarding.headsign ? `${boarding.headsign} 방면` : ""].filter(Boolean).join(" · ")}
          </Text>
        ) : null}
      </View>
      {cars ? (
        <View className="flex-row items-center gap-2">
          <View className="w-9.25 items-center">
            <DesignIcon name="train" size={16} tone="primary" />
          </View>
          <Text className="text-body text-text-secondary">추천 탑승</Text>
          <Text className="text-body font-sans-bold">{cars.carNo}번째 칸</Text>
          {cars.weakAc.length > 0 ? (
            <Text className="text-body text-text-secondary">· 약냉방 {cars.weakAc.join("·")}번째</Text>
          ) : null}
        </View>
      ) : null}
      {alight ? (
        <View className="flex-row items-center gap-2">
          <View className="w-9.25 items-center">
            <View className="h-2 w-2 rounded-pill border-2 border-text" />
          </View>
          <Text className="text-body font-sans-bold">{alight.station} 하차</Text>
          {alight.walkTo ? (
            <Text numberOfLines={1} className="shrink text-body text-text-secondary">
              → 도보 {alight.walkMinutes}분 {alight.walkTo}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** 추천이 아닌 카드의 요약 줄: 호선 알약과 구간 */
function RideSummary({ option }: { option: SubwayRouteOptionDto }) {
  const rides = option.segments.filter((segment) => segment.lineId !== WALK_LINE_ID);
  const single = rides.length === 1;
  return (
    <View className="mt-3 flex-row flex-wrap items-center gap-1.5">
      {rides.map((ride, index) => (
        <View key={`${ride.lineId}-${index}`} className="flex-row items-center gap-1.5">
          <RideBadge lineId={ride.lineId} kind={ride.isExpress ? "급행" : ride.lineId === "09" ? "일반" : undefined} size="md" />
          <Text className="text-body-sm text-text-secondary">{single ? `${ride.fromStationName} → ${ride.toStationName}` : ride.toStationName}</Text>
        </View>
      ))}
    </View>
  );
}

/** 경로 목록의 카드. 추천 카드는 primary-tint 배경과 탑승 안내가 있고, 나머지는 요약 줄과 칩이 있다 */
export function RouteResultCard({ group, boarding, onPress }: RouteResultCardProps) {
  const { colors } = useTheme();
  const { option } = group;
  const recommended = group.recommended;
  const congestion = overallCongestion(option);
  const cars = firstRideCars(option);
  const separateFare = separateFareLineNames(option);
  const operation = operationLabel(option.operationStatus, option.operationNotice);
  const chipTone = recommended ? "bg" : "surface";
  const clock = clockRange(option);
  const walk = walkSeconds(option);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={cn(
        "rounded-lg px-4 py-4.5",
        recommended ? "border-1.5 border-primary bg-primary-tint" : "border border-border bg-bg"
      )}
    >
      <View className="flex-row items-center gap-2">
        <View className="h-6.5 justify-center rounded-pill bg-primary px-2.5">
          <Text className="text-small font-sans-extrabold text-on-primary">{group.title}</Text>
        </View>
        {group.tagline ? (
          <Text numberOfLines={1} className="shrink text-small font-sans-semibold text-primary">
            {group.tagline}
          </Text>
        ) : null}
      </View>

      <View className="mt-3 flex-row items-baseline justify-between">
        <Duration seconds={option.totalDurationSec} large={recommended} />
        <Text className="text-base font-sans-extrabold">{formatFare(option.totalFare)}</Text>
      </View>
      <Text className="mt-0.5 text-body text-text-secondary">
        {[
          clock,
          `환승 ${option.transferCount}회`,
          recommended && walk > 0 ? `도보 ${formatDurationSec(walk)}` : "",
        ]
          .filter(Boolean)
          .join(" · ")}
      </Text>

      <PillSegmentBar option={option} tone={chipTone} />

      {recommended ? <BoardingDetails option={option} boarding={boarding} /> : <RideSummary option={option} />}

      <View className="mt-3 flex-row flex-wrap gap-1.5">
        {congestion ? (
          <InfoChip
            tone={chipTone}
            leading={<View className={cn("h-2 w-2 rounded-pill", CONGESTION_BG[congestion.level])} />}
            label={recommended ? `${congestion.level} · 혼잡도 ${congestion.ratePercent}%` : `${congestion.level} · ${congestion.ratePercent}%`}
          />
        ) : null}
        {!recommended && cars ? <InfoChip tone={chipTone} label={`추천 탑승 ${cars.carNo}번째 칸`} /> : null}
        {separateFare.map((name) => (
          <InfoChip key={name} tone={chipTone} label={`${name} 별도 요금`} />
        ))}
        {operation && (operation.tone === "warning" || recommended) ? (
          <InfoChip
            tone={chipTone}
            leading={
              operation.tone === "ok" ? (
                <DesignIcon name="check" size={12} color={colors.success} />
              ) : (
                <View className="h-2 w-2 rounded-pill bg-error" />
              )
            }
            label={operation.text}
          />
        ) : null}
      </View>
    </Pressable>
  );
}
