import React, { useMemo } from "react";
import { View } from "react-native";
import Svg, { Line } from "react-native-svg";
import type { PathSegmentDto, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { useNextTrainsQuery } from "@/apis/queries/stations/useNextTrainsQuery";
import { useStationFacilitiesQuery } from "@/apis/queries/stations/useStationFacilitiesQuery";
import { DesignIcon } from "@/common/components/DesignIcon";
import { Text } from "@/common/components/Text";
import { formatClock24Kst, formatDistanceKm, formatDurationSec } from "@/common/utils/format";
import { CONGESTION_BG, CONGESTION_TEXT, getLineInfo, useTheme } from "@/theme";
import { cn } from "@/lib/cn";
import { buildTimeline, timeLabel, type TimelineRow } from "../routeTimeline";
import { congestionText, describeDoor, formatWaiting, hasRecommendedCar, isEstimatedCongestion, operationLabel, pickNextTrain } from "../routeView";
import { CarCongestionCard } from "./CarCongestionCard";
import { RideBadge } from "./RideBadge";

interface RouteTimelineProps {
  option: SubwayRouteOptionDto;
  /** "강남역 도착"처럼 마지막 행에 쓰는 도착지 이름 */
  destinationName: string;
}

const NODE_SIZE = "h-3.5 w-3.5";

/** 속이 빈 점 (승차, 하차, 출발). 호선 색 테두리 3px, 호선이 없으면 글자색 */
export function RingNode({ color }: { color?: string }) {
  return (
    <View
      className={cn(NODE_SIZE, "mt-0.5 rounded-pill border-3", color ? "" : "border-text")}
      style={color ? { borderColor: color } : undefined}
    />
  );
}

/** 속이 찬 점 (도착). 색을 주면 그 색으로 채운다 (이탈 화면의 빨간 점) */
export function FilledNode({ color }: { color?: string }) {
  return <View className={cn(NODE_SIZE, "mt-0.5 rounded-pill", color ? "" : "bg-text")} style={color ? { backgroundColor: color } : undefined} />;
}

/** 열차를 타는 동안 이어지는 호선 색 막대 (너비 6px) */
export function SolidBar({ color }: { color: string }) {
  return <View className="mx-auto my-0.5 w-1.5 flex-1 rounded-pill" style={{ backgroundColor: color }} />;
}

/** 걷거나 내린 뒤에 이어지는 점선 */
export function DottedBar() {
  const { colors } = useTheme();
  return (
    <View className="my-1 flex-1 items-center">
      <Svg width={3} height="100%">
        <Line x1={1.5} y1={1.5} x2={1.5} y2="100%" stroke={colors.textDisabled} strokeWidth={3} strokeDasharray="0.1 6" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

function Row({ time, rail, children }: { time?: string; rail: React.ReactNode; children: React.ReactNode }) {
  return (
    <View className="flex-row gap-3">
      <Text className="w-11 pt-0.5 text-small font-sans-bold text-text-secondary">{time ?? ""}</Text>
      <View className="w-4 items-stretch self-stretch">{rail}</View>
      <View className="flex-1 pb-5">{children}</View>
    </View>
  );
}

function InfoLine({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <View className="flex-row items-center gap-2">
      {icon}
      <Text className="flex-1 text-body-sm">{children}</Text>
    </View>
  );
}

/** 승차 행의 요약 상자: 약냉방칸, 이동 역 수와 시간, 운행 상태와 혼잡도 */
function RideSummaryBox({ segment }: { segment: PathSegmentDto }) {
  const { colors } = useTheme();
  const operation = operationLabel(segment.operationStatus, segment.operationNotice);
  const weakAc = (segment.cars ?? []).filter((car) => car.isWeakAirConditioned).map((car) => car.carNo);

  return (
    <View className="mt-2.5 gap-2 rounded-md bg-surface p-3">
      {weakAc.length > 0 ? (
        <InfoLine icon={<DesignIcon name="snow" size={15} color={colors.accent} />}>
          약냉방칸 <Text className="text-body-sm font-sans-bold">{weakAc.join("·")}번째 칸</Text>
        </InfoLine>
      ) : null}
      <InfoLine icon={<DesignIcon name="train" size={15} tone="secondary" />}>
        {segment.stationCount}개 역 · <Text className="text-body-sm font-sans-bold">{formatDurationSec(segment.durationSec)}</Text>
      </InfoLine>
      <InfoLine
        icon={
          operation?.tone === "ok" ? (
            <DesignIcon name="check" size={15} color={colors.success} />
          ) : (
            <View className={cn("mx-1 h-2 w-2 rounded-pill", CONGESTION_BG[segment.congestionLevel])} />
          )
        }
      >
        {operation ? `${operation.text} · ` : ""}
        <Text className={cn("text-body-sm font-sans-bold", CONGESTION_TEXT[segment.congestionLevel])}>
          {congestionText(segment.congestionLevel, segment.congestionRate, isEstimatedCongestion(segment.congestionSource))}
        </Text>
        {isEstimatedCongestion(segment.congestionSource) ? <Text className="text-body-sm text-text-secondary"> (추정)</Text> : null}
      </InfoLine>
    </View>
  );
}

/** 첫 탑승역에서 곧 오는 열차: "중앙보훈병원 방면 · 2분 후 출발" */
function NextTrainLine({ segment }: { segment: PathSegmentDto }) {
  const nextTrains = useNextTrainsQuery({ stationId: segment.fromStationId, limit: 3 });
  if (nextTrains.data?.status !== "OK") return null;
  const train = pickNextTrain(nextTrains.data.trains, segment);
  if (!train) return null;
  return (
    <Text className="mt-1 text-body-sm text-text-secondary">
      {train.headsign} 방면 · {formatWaiting(train.arrivalInSec)}
    </Text>
  );
}

function BoardContent({ row }: { row: Extract<TimelineRow, { kind: "board" }> }) {
  const { segment } = row;
  return (
    <View>
      <View className="flex-row items-center gap-1.5">
        <Text className="text-base font-sans-bold">{segment.fromStationName}</Text>
        <RideBadge lineId={segment.lineId} kind={segment.isExpress ? "급행" : segment.lineId === "09" ? "일반" : undefined} size="md" full />
      </View>
      {row.isFirstRide ? <NextTrainLine segment={segment} /> : null}
      <RideSummaryBox segment={segment} />
      {segment.cars && segment.cars.length > 0 ? (
        <CarCongestionCard
          cars={segment.cars}
          recommendedCarNo={segment.recommendedCarNo}
          estimated={isEstimatedCongestion(segment.congestionSource)}
          forecastLabel={row.timeMs === undefined ? "탈 때 예상이에요" : `${formatClock24Kst(row.timeMs)}에 탈 때 예상이에요`}
        />
      ) : hasRecommendedCar(segment) ? (
        <Text className="mt-2.5 text-body-sm text-text-secondary">{segment.recommendedCarNo}번째 칸이 한산해요</Text>
      ) : null}
    </View>
  );
}

/** 하차나 환승 행. 빠른 하차는 엘리베이터 인접 문과 출구를, 빠른 환승은 환승 문을 안내한다 */
function AlightContent({
  segment,
  transfer,
  walk,
}: {
  segment: PathSegmentDto;
  transfer: boolean;
  walk?: PathSegmentDto;
}) {
  const facilities = useStationFacilitiesQuery(transfer ? undefined : segment.toStationId);
  const doors = facilities.data?.available ? facilities.data.elevatorDoors : [];
  const exits = facilities.data?.available ? facilities.data.exits : [];

  const detail = transfer
    ? segment.recommendedDoors && segment.recommendedDoors.length > 0
      ? `빠른 환승 · ${segment.recommendedDoors.map(describeDoor).join(", ")}`
      : ""
    : [
        doors.length > 0 ? `빠른 하차 · 엘리베이터 · ${doors.map(describeDoor).join(", ")}` : "",
        exits.length > 0 ? `출구 ${exits.map((exit) => exit.exitNo).join(", ")}번` : "",
      ]
        .filter(Boolean)
        .join(" · ");

  return (
    <View>
      <Text className="text-base font-sans-bold">
        {segment.toStationName} {transfer ? "환승" : "하차"}
      </Text>
      {detail ? <Text className="mt-1 text-body-sm text-text-secondary">{detail}</Text> : null}
      {walk ? <WalkLine segment={walk} /> : null}
    </View>
  );
}

function WalkLine({ segment }: { segment: PathSegmentDto }) {
  return (
    <View className="mt-2.5 flex-row items-center gap-1.5">
      <DesignIcon name="walk" size={14} tone="text" strokeWidth={2.2} />
      <Text className="text-body-sm font-sans-bold">
        걸어서 {formatDurationSec(segment.durationSec)} · {formatDistanceKm(segment.distanceKm)}
      </Text>
    </View>
  );
}

/** 프로토타입 경로 상세의 타임라인. 왼쪽에 시각, 가운데에 점과 호선 색 막대, 오른쪽에 승차, 하차, 도보, 도착 안내가 이어진다 */
export function RouteTimeline({ option, destinationName }: RouteTimelineProps) {
  const rows = useMemo(() => buildTimeline(option), [option]);
  const lineColor = (segment: PathSegmentDto) => getLineInfo(segment.lineId).color;

  const elements: React.ReactNode[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const next = rows[i + 1];

    if (row.kind === "depart") {
      elements.push(
        <Row key={row.key} time={timeLabel(row.timeMs)} rail={<><RingNode /><DottedBar /></>}>
          <Text className="text-base font-sans-bold">출발</Text>
        </Row>
      );
    } else if (row.kind === "walk") {
      elements.push(
        <Row key={row.key} rail={<DottedBar />}>
          <WalkLine segment={row.segment} />
        </Row>
      );
    } else if (row.kind === "board") {
      elements.push(
        <Row key={row.key} time={timeLabel(row.timeMs)} rail={<><RingNode color={lineColor(row.segment)} /><SolidBar color={lineColor(row.segment)} /></>}>
          <BoardContent row={row} />
        </Row>
      );
    } else if (row.kind === "alight") {
      const walk = next && next.kind === "walk" ? next.segment : undefined;
      if (walk) i += 1;
      elements.push(
        <Row key={row.key} time={timeLabel(row.timeMs)} rail={<><RingNode color={lineColor(row.segment)} /><DottedBar /></>}>
          <AlightContent segment={row.segment} transfer={row.transfer} walk={walk} />
        </Row>
      );
    } else {
      elements.push(
        <Row key={row.key} time={timeLabel(row.timeMs)} rail={<FilledNode />}>
          <Text className="text-base font-sans-bold">{destinationName} 도착</Text>
        </Row>
      );
    }
  }

  return <View className="mt-5">{elements}</View>;
}
