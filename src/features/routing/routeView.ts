import type {
  OperationNotice,
  OperationStatus,
  PathSegmentDto,
  RecommendationMeta,
  RouteHighlight,
  RouteMode,
  CongestionLevel,
  SegmentCar,
  SubwayRouteOptionDto,
} from "@/apis/queries/routing/searchRoutes";
import type { NextTrain } from "@/apis/queries/stations/getNextTrains";
import { factorWeights, pickRecommended, scoreOptions } from "./recommendScore";
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
  FEW_TRANSFERS: { label: "환승 적게", tags: ["FEWEST_TRANSFERS", "NO_TRANSFER"] },
  WEAK_AC: { label: "약냉방칸", tags: ["WEAK_AC_CAR"] },
  UNCROWDED: { label: "덜 붐비게", tags: ["LEAST_CROWDED"] },
  LESS_WALK: { label: "덜 걷게", tags: ["LEAST_WALK"] },
};

/** 선호 이름을 문장 속에서 잇는 말: 둘 이상이면 앞은 "환승 적고", 마지막은 "약냉방칸 있는"처럼 쓴다 */
const PREF_PHRASE: Record<string, { connective: string; attributive: string }> = {
  "빠르게": { connective: "빠르고", attributive: "빠른" },
  "환승 적게": { connective: "환승 적고", attributive: "환승 적은" },
  "약냉방칸": { connective: "약냉방칸 있고", attributive: "약냉방칸 있는" },
  "덜 붐비게": { connective: "덜 붐비고", attributive: "덜 붐비는" },
  "덜 걷게": { connective: "덜 걷고", attributive: "덜 걷는" },
};

/** 혼잡도 단계를 사람이 말하듯이: 혼잡은 "많이 붐벼요", 보통은 "적당히 붐벼요", 여유는 "여유 있어요" */
export function congestionPhrase(level: CongestionLevel): string {
  if (level === "혼잡") return "많이 붐벼요";
  if (level === "보통") return "적당히 붐벼요";
  return "여유 있어요";
}

/** 마지막 글자 받침에 따라 은 또는 는을 붙인다: "신분당선은", "공항철도는" (한글이 아니면 는) */
export function withTopicParticle(name: string): string {
  const last = name.charCodeAt(name.length - 1);
  const isHangul = last >= 0xac00 && last <= 0xd7a3;
  const hasFinal = isHangul && (last - 0xac00) % 28 !== 0;
  return `${name}${hasFinal ? "은" : "는"}`;
}

export interface RouteGroup {
  option: SubwayRouteOptionDto;
  /** 이 경로를 낸 모드들 (같은 경로면 여러 개) */
  modes: RouteMode[];
  /** 카드 제목: 추천이 포함되면 "추천", 아니면 첫 모드 */
  title: string;
  tagline?: string;
  recommended: boolean;
  /** 종합 점수로 추천이 되었지만 서버가 붙인 이름이 달랐다면 그 이름(예: "최소 비용"). 카드가 보조 문구로 보여 준다 */
  alias?: string;
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
 * 카드에 보이는 한 줄 설명. 사용자의 선호와 맞는 장점이 있으면 "환승 적고 약냉방칸 있는 길로 골랐어요",
 * 없으면 모드의 기본 설명이나 옵션의 장점 한두 개를 쓴다
 */
export function reasonText(
  highlights: RouteHighlight[],
  modes: RouteMode[],
  routePrefs: string[] = []
): string | undefined {
  const matched = matchedPreferences(highlights, routePrefs);
  if (matched.length > 0) {
    const phrases = matched.map((label) => PREF_PHRASE[label]);
    const front = phrases.slice(0, -1).map((phrase) => phrase.connective);
    const last = phrases[phrases.length - 1].attributive;
    return `${[...front, last].join(" ")} 길로 골랐어요`;
  }

  const tagline = modes.map((mode) => MODE_TAGLINE[mode]).find(Boolean);
  if (tagline) return tagline;

  const phrases = highlights.slice(0, 2).map((tag) => HIGHLIGHT_PHRASE[tag]);
  return phrases.length > 0 ? phrases.join(" · ") : undefined;
}

/** 서버 근거 코드를 사용자에게 보이는 이유 문장으로. 먼저 나온 것이 우선이다 */
const REASON_SENTENCE: Array<{ code: string; text: string }> = [
  { code: "PURPOSE_SCHOOL", text: "등하교 시간이라 붐비지 않는 길로 골랐어요" },
  { code: "PURPOSE_COMMUTE", text: "출퇴근 시간이라 붐비지 않는 길로 골랐어요" },
  { code: "PURPOSE_HOSPITAL", text: "환승과 혼잡이 적은 편한 길로 골랐어요" },
  { code: "CONTEXT_RUSH", text: "붐비는 시간이라 덜 붐비는 길로 골랐어요" },
  { code: "CONTEXT_NIGHT", text: "한산한 시간이라 빨리 가는 길로 골랐어요" },
  { code: "HISTORY_COMFORT", text: "자주 고르신 여유로운 길로 골랐어요" },
  { code: "HISTORY_FAST", text: "자주 고르신 빠른 길로 골랐어요" },
  { code: "HISTORY_CHEAP", text: "요금이 적게 드는 길로 골랐어요" },
];

/**
 * 추천 카드의 이유 한 줄. 서버가 준 근거(이동 목적, 시간대, 이력)를 먼저 말하고,
 * 그것이 없으면 설문 취향, 마지막으로 이 후보의 장점 태그를 쓴다
 */
export function recommendationReason(
  meta: RecommendationMeta | undefined,
  highlights: RouteHighlight[],
  routePrefs: string[] = []
): string | undefined {
  const reasons = new Set(meta?.reasons ?? []);
  const sentence = REASON_SENTENCE.find((item) => reasons.has(item.code));
  if (sentence) return sentence.text;
  const matched = matchedPreferences(highlights, routePrefs);
  if (matched.length > 0) {
    const phrases = matched.map((label) => PREF_PHRASE[label]);
    const front = phrases.slice(0, -1).map((phrase) => phrase.connective);
    const last = phrases[phrases.length - 1].attributive;
    return `${[...front, last].join(" ")} 길로 골랐어요`;
  }
  const phrases = highlights.slice(0, 2).map((tag) => HIGHLIGHT_PHRASE[tag]);
  return phrases.length > 0 ? phrases.join(" · ") : undefined;
}

/**
 * 같은 경로는 한 장으로 합치고 추천을 맨 위에 둔다.
 * 로그인한 사용자(서버가 추천 근거 `recommendation`을 준 경우)는 후보들의 시간, 요금, 환승, 혼잡, 도보를
 * 종합 점수로 매겨 최고점 후보를 추천으로 고른다. 비로그인은 서버가 추천을 주지 않아 추천 카드가 없다.
 * 직접 도보 옵션은 지하철 경로와 비교하지 않고 맨 뒤에 둔다
 */
export function groupRouteOptions(
  options: SubwayRouteOptionDto[],
  routePrefs: string[] = [],
  meta?: RecommendationMeta
): RouteGroup[] {
  const bySignature = new Map<string, { option: SubwayRouteOptionDto; modes: RouteMode[] }>();
  for (const option of options) {
    const key = routeSignature(option);
    const group = bySignature.get(key);
    if (group) group.modes.push(option.mode);
    else bySignature.set(key, { option, modes: [option.mode] });
  }

  const entries = [...bySignature.values()];

  // 서버가 추천 근거를 준 경우(로그인)에만 종합 점수로 추천을 고른다. 그렇지 않으면 서버가 표시한 PERSONAL을 쓴다
  const scoredPick = meta
    ? pickRecommended(scoreOptions(entries.map((entry) => entry.option), factorWeights(meta)))
    : undefined;
  const recommendedKey = scoredPick ? routeSignature(scoredPick.option) : undefined;
  const isRecommended = (entry: { option: SubwayRouteOptionDto; modes: RouteMode[] }): boolean =>
    recommendedKey !== undefined ? routeSignature(entry.option) === recommendedKey : entry.modes.includes("PERSONAL");

  const rank = (entry: { option: SubwayRouteOptionDto; modes: RouteMode[] }): number =>
    isRecommended(entry) ? -1 : Math.min(...entry.modes.map((mode) => MODE_ORDER.indexOf(mode)));

  return entries
    .sort((a, b) => rank(a) - rank(b))
    .map((entry) => {
      const { option, modes } = entry;
      const ordered = [...modes].sort((a, b) => MODE_ORDER.indexOf(a) - MODE_ORDER.indexOf(b));
      const recommended = isRecommended(entry);
      // 추천은 한 장뿐이다. 점수로 다른 후보가 추천이 되었으면 서버가 PERSONAL로 표시한 이 카드는 다른 이름으로 보여 준다
      const displayModes = recommended || recommendedKey === undefined ? ordered : ordered.filter((mode) => mode !== "PERSONAL");
      // 서버가 PERSONAL로만 표시한 경로가 추천이 아니면(다른 모드와 합쳐지지 않았으면) 장점으로 이름을 대신한다
      const nameless = displayModes.length === 0;
      const highlights = option.highlights ?? [];
      // 종합 점수로 추천이 되었는데 서버가 붙인 이름이 추천이 아니면(예: 최소 비용) 원래 이름을 남긴다
      const alias =
        recommended && recommendedKey !== undefined && !ordered.includes("PERSONAL") ? MODE_TITLE[ordered[0]] : undefined;
      return {
        option,
        modes: ordered,
        title: recommended ? MODE_TITLE.PERSONAL : nameless ? "다른 경로" : MODE_TITLE[displayModes[0]],
        tagline: recommended
          ? recommendationReason(meta, highlights, routePrefs)
          : reasonText(highlights, displayModes, routePrefs),
        recommended,
        alias,
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

/** 이 구간에 추천 칸이 있는지. 서버는 칸 수를 모르는 노선과 도보 구간에서 `recommendedCarNo`를 0으로 준다 */
export function hasRecommendedCar(segment: { recommendedCarNo: number }): boolean {
  return segment.recommendedCarNo > 0;
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

/** NORMAL은 공지된 이상이 없다는 뜻이라 "공지된 지연은 없어요", UNKNOWN은 아무것도 보이지 않는다 */
export function operationLabel(
  status: OperationStatus,
  notice?: OperationNotice
): OperationLabel | undefined {
  if (status === "NORMAL") return { tone: "ok", text: "공지된 지연은 없어요" };
  if (status === "DISRUPTED") return { tone: "warning", text: notice?.title ?? "운행에 이상이 있어요" };
  return undefined;
}

/** "6-2" 같은 칸-문 번호를 "6번째 칸 2번 문"으로 */
export function describeDoor(door: string): string {
  const [car, doorNo] = door.split("-");
  return doorNo ? `${car}번째 칸 ${doorNo}번 문` : door;
}
