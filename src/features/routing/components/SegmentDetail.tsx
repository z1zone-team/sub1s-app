import React from "react";
import { View } from "react-native";
import type { PathSegmentDto } from "@/apis/queries/routing/searchRoutes";
import { useNextTrainsQuery } from "@/apis/queries/stations/useNextTrainsQuery";
import { CongestionBar } from "@/common/components/CongestionBar";
import { LineBadge } from "@/common/components/LineBadge";
import { Text } from "@/common/components/Text";
import { formatDistanceKm, formatDurationSec } from "@/common/utils/format";
import { CONGESTION_TEXT, WALK_LINE_ID } from "@/theme";
import {
  carInsight,
  describeDoor,
  formatWaiting,
  operationLabel,
  pickNextTrain,
} from "../routeView";
import { cn } from "@/lib/cn";

interface SegmentDetailProps {
  segment: PathSegmentDto;
  /** 첫 탑승 구간에서만 다음 열차를 보여 준다. 뒤 구간의 도착 시각은 지금 알 수 없다 */
  showNextTrain: boolean;
}

export function SegmentDetail({ segment, showNextTrain }: SegmentDetailProps) {
  if (segment.lineId === WALK_LINE_ID) return <WalkDetail segment={segment} />;
  return <RideDetail segment={segment} showNextTrain={showNextTrain} />;
}

function WalkDetail({ segment }: { segment: PathSegmentDto }) {
  return (
    <View className="py-3">
      <Text className="text-body text-text-secondary">
        도보 {formatDurationSec(segment.durationSec)} · {formatDistanceKm(segment.distanceKm)}
        {segment.walkSteps ? ` · ${segment.walkSteps.toLocaleString("en-US")}걸음` : ""}
      </Text>
    </View>
  );
}

function RideDetail({ segment, showNextTrain }: SegmentDetailProps) {
  const operation = operationLabel(segment.operationStatus, segment.operationNotice);
  const insight = carInsight(segment.cars, segment.recommendedCarNo);
  const weakAcCars = (segment.cars ?? []).filter((car) => car.isWeakAirConditioned).map((car) => car.carNo);

  return (
    <View className="gap-2.5 py-3">
      <View className="flex-row items-center gap-2">
        <LineBadge lineId={segment.lineId} suffix={segment.isExpress ? "급행" : "일반"} />
        <Text className="text-heading font-sans-extrabold">{segment.fromStationName}</Text>
      </View>

      {showNextTrain ? <NextTrainLine segment={segment} /> : null}

      <View className="gap-2 rounded-md bg-surface p-3">
        {weakAcCars.length > 0 ? (
          <Text className="text-body-sm">
            약냉방칸 <Text className="font-sans-extrabold">{weakAcCars.join("·")}번째 칸</Text>
          </Text>
        ) : null}
        <Text className="text-body-sm">
          {segment.stationCount}개 역 이동 ·{" "}
          <Text className="font-sans-extrabold">{formatDurationSec(segment.durationSec)}</Text>
        </Text>
        <Text className="text-body-sm">
          혼잡도{" "}
          <Text className={cn("font-sans-extrabold", CONGESTION_TEXT[segment.congestionLevel])}>
            {segment.congestionLevel} {Math.round(segment.congestionRate)}%
          </Text>
          {segment.congestionSource === "MOCK" ? (
            <Text className="text-text-secondary"> (추정)</Text>
          ) : null}
        </Text>
        {operation ? (
          <Text
            className={cn("text-body-sm font-sans-semibold", operation.tone === "warning" ? "text-error" : "text-success")}
          >
            {operation.text}
          </Text>
        ) : null}
      </View>

      {segment.cars && segment.cars.length > 0 ? (
        <View className="gap-2">
          <Text className="text-body font-sans-bold">칸별 혼잡도</Text>
          {insight?.betterThanAveragePercent ? (
            <Text className="text-body-sm text-text-secondary">
              {segment.recommendedCarNo}번째 칸이 평균보다{" "}
              <Text className="font-sans-extrabold text-primary">{insight.betterThanAveragePercent}%</Text>{" "}
              한산해요
            </Text>
          ) : null}
          <CongestionBar
            cars={segment.cars}
            recommendedCarNo={segment.recommendedCarNo}
            weakAcCarNos={weakAcCars}
          />
        </View>
      ) : (
        <Text className="text-body-sm text-text-secondary">추천 탑승 {segment.recommendedCarNo}번째 칸</Text>
      )}

      {segment.recommendedDoors && segment.recommendedDoors.length > 0 ? (
        <Text className="text-body-sm text-text-secondary">
          {segment.toStationName}에서 갈아타기 빠른 문 {segment.recommendedDoors.map(describeDoor).join(", ")}
        </Text>
      ) : null}
    </View>
  );
}

function NextTrainLine({ segment }: { segment: PathSegmentDto }) {
  const nextTrains = useNextTrainsQuery({ stationId: segment.fromStationId, limit: 3 });

  if (nextTrains.data?.status !== "OK") return null;
  const train = pickNextTrain(nextTrains.data.trains, segment);
  if (!train) return null;

  return (
    <Text className="text-body-sm text-text-secondary">
      {train.headsign} 방면 · {formatWaiting(train.arrivalInSec)}
    </Text>
  );
}
