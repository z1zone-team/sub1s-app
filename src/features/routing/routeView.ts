import type {
  OperationNotice,
  OperationStatus,
  PathSegmentDto,
  RouteHighlight,
  RouteMode,
  SegmentCar,
  SubwayRouteOptionDto,
} from "@/apis/queries/routing/searchRoutes";
import type { NextTrain } from "@/apis/queries/stations/getNextTrains";
import { formatClockKst } from "@/common/utils/format";
import { WALK_LINE_ID } from "@/theme";

export const MODE_TITLE: Record<RouteMode, string> = {
  OPTIMAL: "최적",
  COMFORTABLE: "여유",
  PERSONAL: "추천",
  CHEAPEST: "최소 비용",
  ONLY_WALK: "도보",
};

const MODE_TAGLINE: Partial<Record<RouteMode, string>> = {
  OPTIMAL: "가장 빨리 도착해요",
  COMFORTABLE: "혼잡한 구간과 칸을 피했어요",
  CHEAPEST: "요금이 가장 적어요",
};

/** 추천 카드를 맨 위에 두고 나머지는 이 순서로 보여 준다 */
const MODE_ORDER: RouteMode[] = ["PERSONAL", "OPTIMAL", "COMFORTABLE", "CHEAPEST", "ONLY_WALK"];

/** 서버 `highlights` 태그를 사용자에게 보이는 말로 */
const HIGHLIGHT_PHRASE: Record<RouteHighlight, string> = {
  FASTEST: "가장 빨라요",
  FEWEST_TRANSFERS: "환승이 가장 적어요",
  NO_TRANSFER: "환승 없이 가요",
  LEAST_CROWDED: "가장 한산해요",
  LEAST_WALK: "걷는 거리가 가장 짧아요",
  CHEAPEST: "요금이 가장 적어요",
  WEAK_AC_CAR: "약냉방칸이 있는 노선이에요",
};

/** 온보딩 설문(`routePrefs`)과 맞는 태그 (API_SPEC 2.2 대응표) */
const PREF_TAGS: Record<string, { label: string; tags: RouteHighlight[] }> = {
  FAST: { label: "빠르게", tags: ["FASTEST"] },
  FEWEST_TRANSFERS: { label: "환승 적게", tags: ["FEWEST_TRANSFERS", "NO_TRANSFER"] },
  WEAK_AC: { label: "약냉방칸", tags: ["WEAK_AC_CAR"] },
  UNCROWDED: { label: "덜 붐비게", tags: ["LEAST_CROWDED"] },
  LESS_WALK: { label: "덜 걷게", tags: ["LEAST_WALK"] },
};

export interface RouteGroup {
  option: SubwayRouteOptionDto;
  /** 이 경로를 낸 모드들 (같은 경로면 여러 개) */
  modes: RouteMode[];
  /** 카드 제목: 추천이 포함되면 "추천", 아니면 첫 모드 */
  title: string;
  tagline?: string;
  recommended: boolean;
}

const isRide = (segment: PathSegmentDto): boolean => segment.lineId !== WALK_LINE_ID;

/** 시간, 요금, 환승, 경유 구간이 모두 같으면 같은 경로로 본다 */
export function routeSignature(option: SubwayRouteOptionDto): string {
  const legs = option.segments
    .map((segment) =>
      [segment.lineId, segment.fromStationId, segment.toStationId, segment.isExpress ? "E" : "N"].join(":")
    )
    .join(">");
  return [option.totalDurationSec, option.totalFare, option.transferCount, legs].join("|");
}

/** 선호하는 설문 항목 중 이 옵션의 장점과 맞는 것의 이름. 설문이 없으면 빈 목록 */
export function matchedPreferences(
  highlights: RouteHighlight[],
  routePrefs: string[] = []
): string[] {
  return routePrefs
    .map((code) => PREF_TAGS[code])
    .filter((pref): pref is { label: string; tags: RouteHighlight[] } => Boolean(pref))
    .filter((pref) => pref.tags.some((tag) => highlights.includes(tag)))
    .map((pref) => pref.label);
}

/**
 * 카드에 보이는 한 줄 설명. 사용자의 선호와 맞는 장점이 있으면 "환승 적게 · 약냉방칸 선호에 맞췄어요",
 * 없으면 모드의 기본 설명이나 옵션의 장점 한두 개를 쓴다
 */
export function reasonText(
  highlights: RouteHighlight[],
  modes: RouteMode[],
  routePrefs: string[] = []
): string | undefined {
  const matched = matchedPreferences(highlights, routePrefs);
  if (matched.length > 0) return `${matched.join(" · ")} 선호에 맞췄어요`;

  const tagline = modes.map((mode) => MODE_TAGLINE[mode]).find(Boolean);
  if (tagline) return tagline;

  const phrases = highlights.slice(0, 2).map((tag) => HIGHLIGHT_PHRASE[tag]);
  return phrases.length > 0 ? phrases.join(" · ") : undefined;
}

/**
 * 같은 경로는 한 장으로 합치고 추천을 맨 위에 둔다.
 * 직접 도보 옵션은 지하철 경로와 비교하지 않고 맨 뒤에 둔다
 */
export function groupRouteOptions(
  options: SubwayRouteOptionDto[],
  routePrefs: string[] = []
): RouteGroup[] {
  const bySignature = new Map<string, { option: SubwayRouteOptionDto; modes: RouteMode[] }>();
  for (const option of options) {
    const key = routeSignature(option);
    const group = bySignature.get(key);
    if (group) group.modes.push(option.mode);
    else bySignature.set(key, { option, modes: [option.mode] });
  }

  const rank = (modes: RouteMode[]): number =>
    Math.min(...modes.map((mode) => MODE_ORDER.indexOf(mode)));

  return [...bySignature.values()]
    .sort((a, b) => rank(a.modes) - rank(b.modes))
    .map(({ option, modes }) => {
      const ordered = [...modes].sort((a, b) => MODE_ORDER.indexOf(a) - MODE_ORDER.indexOf(b));
      return {
        option,
        modes: ordered,
        title: MODE_TITLE[ordered[0]],
        tagline: reasonText(option.highlights ?? [], ordered, routePrefs),
        recommended: ordered.includes("PERSONAL"),
      };
    });
}

/** 출발·도착 도보와 환승 도보를 합친 시간. 전체 시간에서 탑승 시간을 뺀 값이다 */
export function walkSeconds(option: SubwayRouteOptionDto): number {
  const ride = option.segments.filter(isRide).reduce((sum, segment) => sum + segment.durationSec, 0);
  return Math.max(0, option.totalDurationSec - ride);
}

/** "오후 2:17 - 오후 2:51". 도착 시각에서 소요 시간을 빼 출발 시각을 구한다 */
export function clockRange(option: SubwayRouteOptionDto): string {
  const arrival = Date.parse(option.estimatedArrivalTimestamp);
  if (Number.isNaN(arrival)) return "";
  const departure = arrival - option.totalDurationSec * 1000;
  return `${formatClockKst(departure)} - ${formatClockKst(arrival)}`;
}

/** 구간 막대에서 구간이 차지하는 비율(0~1). 소요시간이 없으면 균등 */
export function segmentShares(option: SubwayRouteOptionDto): number[] {
  const total = option.segments.reduce((sum, segment) => sum + Math.max(0, segment.durationSec), 0);
  if (total <= 0) return option.segments.map(() => 1 / Math.max(1, option.segments.length));
  return option.segments.map((segment) => Math.max(0, segment.durationSec) / total);
}

/** 구간과 같은 방향·급행 여부의 열차 중 가장 먼저 오는 것 */
export function pickNextTrain(
  trains: NextTrain[],
  segment: Pick<PathSegmentDto, "direction" | "isExpress">
): NextTrain | undefined {
  return trains
    .filter((train) => train.direction === segment.direction && train.isExpress === segment.isExpress)
    .sort(
      (a, b) =>
        (a.arrivalInSec ?? Number.MAX_SAFE_INTEGER) - (b.arrivalInSec ?? Number.MAX_SAFE_INTEGER)
    )[0];
}

/** 시각표 기반이라 "출발" 시각이다. 1분 미만이면 "곧", 아니면 올림한 분 */
export function formatWaiting(arrivalInSec: number | null): string {
  if (arrivalInSec === null) return "";
  if (arrivalInSec < 60) return "곧 출발";
  return `${Math.ceil(arrivalInSec / 60)}분 후 출발`;
}

export interface CarInsight {
  /** 추천 칸이 구간 평균보다 얼마나 한산한지(%, 정수). 평균과 같거나 더 붐비면 undefined */
  betterThanAveragePercent?: number;
  averageRate: number;
}

/** "3번째 칸이 평균보다 21% 한산해요" */
export function carInsight(cars: SegmentCar[] | undefined, recommendedCarNo: number): CarInsight | undefined {
  if (!cars || cars.length === 0) return undefined;
  const average = cars.reduce((sum, car) => sum + car.rate, 0) / cars.length;
  const recommended = cars.find((car) => car.carNo === recommendedCarNo);
  if (!recommended || average <= 0) return { averageRate: Math.round(average) };

  const better = Math.round(((average - recommended.rate) / average) * 100);
  return {
    averageRate: Math.round(average),
    betterThanAveragePercent: better > 0 ? better : undefined,
  };
}

export interface OperationLabel {
  tone: "ok" | "warning";
  text: string;
}

/** NORMAL은 공지된 이상이 없다는 뜻이라 "공지된 이상 없음", UNKNOWN은 아무것도 보이지 않는다 */
export function operationLabel(
  status: OperationStatus,
  notice?: OperationNotice
): OperationLabel | undefined {
  if (status === "NORMAL") return { tone: "ok", text: "공지된 이상 없음" };
  if (status === "DISRUPTED") return { tone: "warning", text: notice?.title ?? "운행에 이상이 있어요" };
  return undefined;
}

/** "6-2" 같은 칸-문 번호를 "6번째 칸 2번 문"으로 */
export function describeDoor(door: string): string {
  const [car, doorNo] = door.split("-");
  return doorNo ? `${car}번째 칸 ${doorNo}번 문` : door;
}
