import type { PathSegmentDto, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { formatClock24Kst } from "@/common/utils/format";
import { getLineInfo, levelOfRate, WALK_LINE_ID, type CongestionLevel } from "@/theme";
import type { RouteEndpoint } from "./endpoint";
import { isEstimatedCongestion } from "./routeView";

/** 통합 요금이 아니라 별도 운임이 붙는 노선 (신분당선, 의정부경전철, GTX-A). DATA_PIPELINE.md 1.4절 */
const SEPARATE_FARE_LINE_IDS = ["SB", "UJ", "GA"];

const isRide = (segment: PathSegmentDto): boolean => segment.lineId !== WALK_LINE_ID;

/** 상단 박스의 이름. 지하철역은 "가양역"처럼 "역"을 붙이고, 장소와 현재 위치는 그대로 쓴다 */
export function endpointLabel(endpoint: RouteEndpoint): string {
  if (!endpoint.stationId) return endpoint.name;
  return endpoint.name.endsWith("역") ? endpoint.name : `${endpoint.name}역`;
}

/** "오늘 14:17 출발" */
export function departureLabel(nowMs: number): string {
  return `오늘 ${formatClock24Kst(nowMs)} 출발`;
}

/** 소요 시간을 큰 숫자와 작은 단위로 나눠 그리기 위한 값. 1시간 22분이면 시간 1, 분 22 */
export function splitDuration(seconds: number): { hours: number; minutes: number } {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.max(1, Math.round(seconds / 60)) : 0;
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

/**
 * 탑승 구간의 혼잡도를 소요 시간으로 가중 평균해 한 줄로 요약한다. 탑승 구간이 없으면 undefined.
 * 탑승 구간 하나라도 통계가 아닌 추정이면 estimated이고, 화면은 이때 퍼센트를 보이지 않는다
 */
export function overallCongestion(
  option: SubwayRouteOptionDto
): { level: CongestionLevel; ratePercent: number; estimated: boolean } | undefined {
  const rides = option.segments.filter(isRide);
  const weight = rides.reduce((sum, segment) => sum + Math.max(0, segment.durationSec), 0);
  if (rides.length === 0) return undefined;

  const rate =
    weight > 0
      ? rides.reduce((sum, segment) => sum + segment.congestionRate * Math.max(0, segment.durationSec), 0) / weight
      : rides.reduce((sum, segment) => sum + segment.congestionRate, 0) / rides.length;
  const ratePercent = Math.round(rate);
  return {
    level: levelOfRate(ratePercent),
    ratePercent,
    estimated: rides.some((segment) => isEstimatedCongestion(segment.congestionSource)),
  };
}

export interface PillSegment {
  key: string;
  isWalk: boolean;
  lineId: string;
  /** 구간 막대에서 차지하는 폭(flex 값) */
  flex: number;
  /** 알약 안의 글자. 좁으면 빈 문자열 */
  label: string;
}

const MIN_FLEX = 1;
const LONG_SHARE = 0.3;
const MEDIUM_SHARE = 0.08;
const WALK_LONG_SHARE = 0.15;

const minutesOf = (segment: PathSegmentDto): number => Math.max(1, Math.round(segment.durationSec / 60));

/** 9호선은 급행과 일반이 함께 달려서 일반이라고 밝혀 준다. 다른 노선은 급행일 때만 표시한다 */
function trainKindText(segment: PathSegmentDto): string {
  if (segment.isExpress) return " 급행";
  return segment.lineId === "09" ? " 일반" : "";
}

/**
 * 프로토타입의 구간 알약 막대에 들어갈 조각들. 폭은 소요 시간 비례이고,
 * 탑승 구간은 넓으면 "9호선 급행 24분", 중간이면 "22분", 좁으면 글자 없이 색만 보인다.
 * 도보는 넓으면 "8분", 좁으면 숫자만 보인다
 */
export function pillSegments(option: SubwayRouteOptionDto): PillSegment[] {
  const total = option.segments.reduce((sum, segment) => sum + Math.max(0, segment.durationSec), 0);

  return option.segments.map((segment, index) => {
    const share = total > 0 ? Math.max(0, segment.durationSec) / total : 1 / option.segments.length;
    const flex = Math.max(MIN_FLEX, Math.round(share * 100));
    const walk = !isRide(segment);
    const minutes = minutesOf(segment);

    let label = "";
    if (walk) {
      label = share >= WALK_LONG_SHARE ? `${minutes}분` : `${minutes}`;
    } else if (share >= LONG_SHARE) {
      label = `${getLineInfo(segment.lineId).name}${trainKindText(segment)} ${minutes}분`;
    } else if (share >= MEDIUM_SHARE) {
      label = `${minutes}분`;
    }
    return { key: `${segment.lineId}-${index}`, isWalk: walk, lineId: segment.lineId, flex, label };
  });
}

/** 약냉방칸 번호들 (작은 번호부터) */
export function weakAcCarNumbers(segment: PathSegmentDto): number[] {
  return (segment.cars ?? [])
    .filter((car) => car.isWeakAirConditioned)
    .map((car) => car.carNo)
    .sort((a, b) => a - b);
}

/** 첫 탑승 구간의 추천 칸과 약냉방칸. 탑승 구간이 없거나 추천 칸이 없으면 undefined */
export function firstRideCars(
  option: SubwayRouteOptionDto
): { carNo: number; weakAc: number[] } | undefined {
  const ride = option.segments.find(isRide);
  if (!ride || !ride.recommendedCarNo) return undefined;
  return { carNo: ride.recommendedCarNo, weakAc: weakAcCarNumbers(ride) };
}

/** 이 경로가 지나는 별도 운임 노선 이름들 (중복 없이 지나가는 순서대로) */
export function separateFareLineNames(option: SubwayRouteOptionDto): string[] {
  const names: string[] = [];
  for (const segment of option.segments) {
    if (!SEPARATE_FARE_LINE_IDS.includes(segment.lineId)) continue;
    const name = getLineInfo(segment.lineId).name;
    if (!names.includes(name)) names.push(name);
  }
  return names;
}

/** 마지막 탑승 구간의 하차역과, 그 뒤에 도보가 있으면 도보 분과 목적지 */
export function alightInfo(
  option: SubwayRouteOptionDto
): { station: string; walkMinutes?: number; walkTo?: string } | undefined {
  const rides = option.segments.filter(isRide);
  const lastRide = rides[rides.length - 1];
  if (!lastRide) return undefined;

  const last = option.segments[option.segments.length - 1];
  if (last && !isRide(last)) {
    return { station: lastRide.toStationName, walkMinutes: minutesOf(last), walkTo: last.toStationName };
  }
  return { station: lastRide.toStationName };
}

/** 다음 열차까지 남은 시간. 1분 미만이면 "곧", 모르면 빈 문자열 */
export function waitingText(arrivalInSec: number | null | undefined): string {
  if (arrivalInSec === null || arrivalInSec === undefined) return "";
  if (arrivalInSec < 60) return "곧";
  return `${Math.ceil(arrivalInSec / 60)}분 후`;
}
