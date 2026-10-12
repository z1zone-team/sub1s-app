import React, { useMemo } from "react";
import { View } from "react-native";
import type { PathSegmentDto, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { useNextTrainsQuery } from "@/apis/queries/stations/useNextTrainsQuery";
import { useStationFacilitiesQuery } from "@/apis/queries/stations/useStationFacilitiesQuery";
import { RiseIn } from "@/common/components/RiseIn";
import { Text } from "@/common/components/Text";
import { formatClockKst, formatDurationSec } from "@/common/utils/format";
import { DottedBar, FilledNode, RingNode, SolidBar } from "@/features/routing/components/RouteTimeline";
import { RideBadge } from "@/features/routing/components/RideBadge";
import { describeDoor, formatWaiting, pickNextTrain } from "@/features/routing/routeView";
import { getLineInfo, useTheme } from "@/theme";
import { cn } from "@/lib/cn";
import { delayParts } from "../offRoute";
import { buildRerouteRows, type RerouteRow } from "../rerouteView";

interface RerouteCardProps {
  option: SubwayRouteOptionDto;
  /** 이탈을 알아챈 역 이름 */
  detectedStationName: string;
  /** 이탈한 시점에 원래 경로에서 남아 있던 시간(초). 지연 시간을 구한다 */
  previousRemainingSec: number;
}

function Row({ rail, children, last = false }: { rail: React.ReactNode; children: React.ReactNode; last?: boolean }) {
  return (
    <View className="flex-row gap-3">
      <View className="w-4 items-stretch self-stretch">{rail}</View>
      <View className={cn("flex-1", last ? "" : "pb-4.5")}>{children}</View>
    </View>
  );
}

/** 새 경로에서 첫 탑승역에 곧 오는 열차: "중앙보훈병원 방면 · 4분 후 출발" */
function NextTrainLine({ segment }: { segment: PathSegmentDto }) {
  const nextTrains = useNextTrainsQuery({ stationId: segment.fromStationId, limit: 3 });
  if (nextTrains.data?.status !== "OK") return null;
  const train = pickNextTrain(nextTrains.data.trains, segment);
  if (!train) return null;
  return (
    <Text className="mt-0.75 text-body-sm text-text-secondary">
      {train.headsign} 방면 · {formatWaiting(train.arrivalInSec)}
    </Text>
  );
}

/** 도착 행 부제: 엘리베이터와 가까운 문과 뒤따르는 도보 */
function ArriveDetail({ row }: { row: Extract<RerouteRow, { kind: "arrive" }> }) {
  const facilities = useStationFacilitiesQuery(row.stationId);
  const doors = facilities.data?.available ? facilities.data.elevatorDoors : [];
  const text = [
    doors.length > 0 ? `엘리베이터와 가까운 문 ${doors.map(describeDoor).join(", ")}` : "",
    row.walkTo && row.walkMinutes ? `${row.walkTo}까지 도보 ${row.walkMinutes}분` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return text ? <Text className="mt-0.75 text-body-sm text-text-secondary">{text}</Text> : null;
}

/**
 * 이탈 화면의 "새 경로" 카드. 도착 시각과 지연 시간, 그리고 "이탈한 역 하차 → 새 열차 승차 → 도착역 하차" 타임라인.
 * 아래에서 24px 올라오며 나타난다 (프로토타입의 up: 0.2초 뒤 시작, 0.4초)
 */
export function RerouteCard({ option, detectedStationName, previousRemainingSec }: RerouteCardProps) {
  const { colors } = useTheme();
  const rows = useMemo(() => buildRerouteRows(option, detectedStationName), [option, detectedStationName]);
  const delay = delayParts(option.totalDurationSec, previousRemainingSec);
  const arrival = Date.parse(option.estimatedArrivalTimestamp);

  return (
    <RiseIn from={24} durationMs={400} delayMs={200}>
      <View className="rounded-lg border border-border bg-bg px-4 py-4.5">
        <View className="flex-row items-baseline justify-between">
          <Text className="text-base font-sans-bold">새 경로</Text>
          <Text className="text-body-sm text-text-secondary">
            {!Number.isNaN(arrival) ? `${formatClockKst(arrival)} 도착 · ` : ""}
            <Text className={cn("text-body-sm font-sans-bold", delay.late ? "text-error" : "text-text")}>{delay.text}</Text>
          </Text>
        </View>

        <View className="mt-4">
          {rows.map((row, index) => {
            const last = index === rows.length - 1;
            if (row.kind === "leave") {
              return (
                <Row key={row.key} rail={<><FilledNode color={colors.error} /><DottedBar /></>}>
                  <Text className="text-subtitle font-sans-bold">{row.stationName} 하차</Text>
                  <Text className="mt-0.75 text-body-sm text-text-secondary">
                    맞은편 승강장으로 이동{row.walkMinutes ? ` (${formatDurationSec(row.walkMinutes * 60)})` : ""}
                  </Text>
                </Row>
              );
            }
            if (row.kind === "board") {
              const color = getLineInfo(row.segment.lineId).color;
              return (
                <Row key={row.key} rail={<><RingNode color={color} /><SolidBar color={color} /></>}>
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-subtitle font-sans-bold">{row.segment.fromStationName}</Text>
                    <RideBadge
                      lineId={row.segment.lineId}
                      kind={row.segment.isExpress ? "급행" : row.segment.lineId === "09" ? "일반" : undefined}
                      size="md"
                      full
                    />
                  </View>
                  {row.isFirstRide ? (
                    <NextTrainLine segment={row.segment} />
                  ) : (
                    <Text className="mt-0.75 text-body-sm text-text-secondary">
                      {row.segment.stationCount}개 역 이동 · {formatDurationSec(row.segment.durationSec)}
                    </Text>
                  )}
                </Row>
              );
            }
            return (
              <Row key={row.key} rail={<FilledNode />} last={last}>
                <Text className="text-subtitle font-sans-bold">{row.stationName} 하차</Text>
                <ArriveDetail row={row} />
              </Row>
            );
          })}
        </View>
      </View>
    </RiseIn>
  );
}
