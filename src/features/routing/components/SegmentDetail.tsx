import React from "react";
import { Text, View } from "react-native";
import type { PathSegmentDto } from "@/apis/queries/routing/searchRoutes";
import { useNextTrainsQuery } from "@/apis/queries/stations/useNextTrainsQuery";
import { CongestionBar } from "@/common/components/CongestionBar";
import { LineBadge } from "@/common/components/LineBadge";
import { formatDistanceKm, formatDurationSec } from "@/common/utils/format";
import { congestionColor, useTheme, WALK_LINE_ID } from "@/theme";
import {
  carInsight,
  describeDoor,
  formatWaiting,
  operationLabel,
  pickNextTrain,
} from "../routeView";

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
  const { colors } = useTheme();

  return (
    <View style={{ paddingVertical: 12 }}>
      <Text style={{ fontSize: 14, color: colors.textSecondary }}>
        도보 {formatDurationSec(segment.durationSec)} · {formatDistanceKm(segment.distanceKm)}
        {segment.walkSteps ? ` · ${segment.walkSteps.toLocaleString("en-US")}걸음` : ""}
      </Text>
    </View>
  );
}

function RideDetail({ segment, showNextTrain }: SegmentDetailProps) {
  const { colors } = useTheme();
  const operation = operationLabel(segment.operationStatus, segment.operationNotice);
  const insight = carInsight(segment.cars, segment.recommendedCarNo);
  const weakAcCars = (segment.cars ?? []).filter((car) => car.isWeakAirConditioned).map((car) => car.carNo);

  return (
    <View style={{ paddingVertical: 12, gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <LineBadge lineId={segment.lineId} suffix={segment.isExpress ? "급행" : "일반"} />
        <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text }}>
          {segment.fromStationName}
        </Text>
      </View>

      {showNextTrain ? <NextTrainLine segment={segment} /> : null}

      <View
        style={{
          padding: 12,
          gap: 8,
          borderRadius: 12,
          backgroundColor: colors.surface,
        }}
      >
        {weakAcCars.length > 0 ? (
          <Text style={{ fontSize: 13, color: colors.text }}>
            약냉방칸 <Text style={{ fontWeight: "800" }}>{weakAcCars.join("·")}번째 칸</Text>
          </Text>
        ) : null}
        <Text style={{ fontSize: 13, color: colors.text }}>
          {segment.stationCount}개 역 이동 ·{" "}
          <Text style={{ fontWeight: "800" }}>{formatDurationSec(segment.durationSec)}</Text>
        </Text>
        <Text style={{ fontSize: 13, color: colors.text }}>
          혼잡도{" "}
          <Text style={{ fontWeight: "800", color: congestionColor(segment.congestionLevel, colors) }}>
            {segment.congestionLevel} {Math.round(segment.congestionRate)}%
          </Text>
          {segment.congestionSource === "MOCK" ? (
            <Text style={{ color: colors.textSecondary }}> (추정)</Text>
          ) : null}
        </Text>
        {operation ? (
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: operation.tone === "warning" ? colors.error : colors.success,
            }}
          >
            {operation.text}
          </Text>
        ) : null}
      </View>

      {segment.cars && segment.cars.length > 0 ? (
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>칸별 혼잡도</Text>
          {insight?.betterThanAveragePercent ? (
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              {segment.recommendedCarNo}번째 칸이 평균보다{" "}
              <Text style={{ fontWeight: "800", color: colors.primary }}>
                {insight.betterThanAveragePercent}%
              </Text>{" "}
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
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>
          추천 탑승 {segment.recommendedCarNo}번째 칸
        </Text>
      )}

      {segment.recommendedDoors && segment.recommendedDoors.length > 0 ? (
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>
          {segment.toStationName}에서 갈아타기 빠른 문 {segment.recommendedDoors.map(describeDoor).join(", ")}
        </Text>
      ) : null}
    </View>
  );
}

function NextTrainLine({ segment }: { segment: PathSegmentDto }) {
  const { colors } = useTheme();
  const nextTrains = useNextTrainsQuery({ stationId: segment.fromStationId, limit: 3 });

  if (nextTrains.data?.status !== "OK") return null;
  const train = pickNextTrain(nextTrains.data.trains, segment);
  if (!train) return null;

  return (
    <Text style={{ fontSize: 13, color: colors.textSecondary }}>
      {train.headsign} 방면 · {formatWaiting(train.arrivalInSec)}
    </Text>
  );
}
