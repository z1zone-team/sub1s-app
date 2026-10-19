import type {
  PathSegmentDto,
  RecommendationMeta,
  RouteHighlight,
  RouteMode,
  SegmentCar,
  SubwayRouteOptionDto,
} from "@/apis/queries/routing/searchRoutes";
import type { NextTrain } from "@/apis/queries/stations/getNextTrains";
import {
  carInsight,
  hasRecommendedCar,
  congestionPhrase,
  congestionText,
  isEstimatedCongestion,
  clockRange,
  describeDoor,
  doorGuideLines,
  NO_FAST_TRANSFER_TEXT,
  formatWaiting,
  groupRouteOptions,
  matchedPreferences,
  operationLabel,
  pickNextTrain,
  reasonText,
  recommendationReason,
  routeSignature,
  withTopicParticle,
  segmentShares,
  walkSeconds,
} from "./routeView";

const ride = (
  lineId: string,
  from: string,
  to: string,
  durationSec: number,
  over: Partial<PathSegmentDto> = {}
): PathSegmentDto => ({
  lineId,
  direction: "DOWN",
  isExpress: false,
  fromStationId: from,
  fromStationName: from,
  toStationId: to,
  toStationName: to,
  stationCount: 5,
  durationSec,
  distanceKm: 5,
  recommendedCarNo: 3,
  isWeakAirConditioned: false,
  congestionLevel: "보통",
  congestionRate: 50,
  operationStatus: "NORMAL",
  ...over,
});

const walk = (durationSec: number): PathSegmentDto =>
  ride("WALK", "ORIGIN_COORDINATE", "09_907", durationSec, { direction: "NONE" });

const option = (
  mode: RouteMode,
  over: Partial<SubwayRouteOptionDto> = {}
): SubwayRouteOptionDto => ({
  mode,
  totalDurationSec: 2040,
  totalDistanceKm: 20,
  totalFare: 1750,
  transferCount: 0,
  estimatedArrivalTimestamp: "2026-10-11T14:51:00.000+09:00",
  segments: [ride("09", "09_907", "09_925", 1440, { isExpress: true })],
  highlights: [],
  operationStatus: "NORMAL",
  ...over,
});

describe("routeSignature", () => {
  it("is the same for the same route and differs when time, fare, transfers or legs differ", () => {
    expect(routeSignature(option("OPTIMAL"))).toBe(routeSignature(option("COMFORTABLE")));
    expect(routeSignature(option("OPTIMAL"))).not.toBe(
      routeSignature(option("OPTIMAL", { totalDurationSec: 2100 }))
    );
    expect(routeSignature(option("OPTIMAL"))).not.toBe(routeSignature(option("OPTIMAL", { totalFare: 1850 })));
    expect(routeSignature(option("OPTIMAL"))).not.toBe(
      routeSignature(option("OPTIMAL", { segments: [ride("09", "09_907", "09_925", 1440)] }))
    );
  });
});

describe("groupRouteOptions", () => {
  it("merges the modes that returned the same route into one card", () => {
    const groups = groupRouteOptions([
      option("OPTIMAL"),
      option("COMFORTABLE"),
      option("PERSONAL"),
      option("CHEAPEST"),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].modes).toEqual(["PERSONAL", "OPTIMAL", "COMFORTABLE", "CHEAPEST"]);
    expect(groups[0].title).toBe("추천");
    expect(groups[0].recommended).toBe(true);
  });

  it("keeps each mode once when identical options are repeated", () => {
    const groups = groupRouteOptions([option("OPTIMAL"), option("CHEAPEST"), option("OPTIMAL")]);
    expect(groups).toHaveLength(1);
    expect(groups[0].modes).toEqual(["OPTIMAL", "CHEAPEST"]);
  });

  it("keeps different routes apart, with the recommended one first and the rest in mode order", () => {
    const fast = option("OPTIMAL", { totalDurationSec: 1800 });
    const calm = option("COMFORTABLE", { totalDurationSec: 2400 });
    const cheap = option("CHEAPEST", { totalDurationSec: 2700, totalFare: 1650 });
    const personal = option("PERSONAL", { totalDurationSec: 2040 });

    const groups = groupRouteOptions([fast, calm, personal, cheap]);

    expect(groups.map((g) => g.title)).toEqual(["추천", "종합 최적", "여유", "최소 비용"]);
    expect(groups.map((g) => g.recommended)).toEqual([true, false, false, false]);
  });

  it("names a merged card after its first mode when there is no recommended one", () => {
    const [group] = groupRouteOptions([option("COMFORTABLE"), option("CHEAPEST")]);

    expect(group.modes).toEqual(["COMFORTABLE", "CHEAPEST"]);
    expect(group.title).toBe("여유");
    expect(group.recommended).toBe(false);
  });

  it("puts the direct walk option last", () => {
    const groups = groupRouteOptions([
      option("ONLY_WALK", { totalDurationSec: 600, segments: [walk(600)] }),
      option("OPTIMAL"),
    ]);

    expect(groups.map((g) => g.title)).toEqual(["종합 최적", "도보"]);
  });

  it("returns nothing for no options", () => {
    expect(groupRouteOptions([])).toEqual([]);
  });
});

describe("reasonText", () => {
  it("lists the preferences the route fits, in the order the user ranked them", () => {
    expect(
      reasonText(["FEWEST_TRANSFERS", "WEAK_AC_CAR", "FASTEST"], ["PERSONAL"], ["FEW_TRANSFERS", "WEAK_AC"])
    ).toBe("환승 적고 약냉방칸 있는 길로 골랐어요");
  });

  it("counts no transfer at all as fitting the fewer-transfers preference", () => {
    expect(reasonText(["NO_TRANSFER"], ["PERSONAL"], ["FEW_TRANSFERS"])).toBe("환승 적은 길로 골랐어요");
  });

  it("falls back to the mode tagline, then to the route highlights, when no preference fits", () => {
    expect(reasonText(["FASTEST"], ["OPTIMAL"], ["UNCROWDED"])).toBe("시간·요금·환승·혼잡·도보를 함께 비교했어요");
    expect(reasonText(["LEAST_WALK", "CHEAPEST", "FASTEST"], ["PERSONAL"], [])).toBe(
      "걷는 거리가 가장 짧아요 · 요금이 가장 적어요"
    );
  });

  it("has nothing to say without a tagline or highlights", () => {
    expect(reasonText([], ["PERSONAL"])).toBeUndefined();
  });

  it("ignores preference codes it does not know, such as the seat and elevator choices", () => {
    expect(matchedPreferences(["FASTEST"], ["SEAT", "ELEVATOR", "FAST"])).toEqual(["빠르게"]);
  });
});

describe("times and distances", () => {
  it("writes the departure and arrival times in Korean time", () => {
    expect(clockRange(option("OPTIMAL"))).toBe("오후 2:17 - 오후 2:51");
  });

  it("writes midnight as 12 AM and crosses the date line from the evening before", () => {
    expect(
      clockRange(option("OPTIMAL", { totalDurationSec: 600, estimatedArrivalTimestamp: "2026-10-11T00:05:00.000+09:00" }))
    ).toBe("오후 11:55 - 오전 12:05");
  });

  it("is empty for an unreadable arrival time", () => {
    expect(clockRange(option("OPTIMAL", { estimatedArrivalTimestamp: "x" }))).toBe("");
  });

  it("counts the walking between lines as walking time, not only the first and last mile", () => {
    const withTransfer = option("OPTIMAL", {
      totalDurationSec: 2400,
      segments: [walk(300), ride("09", "a", "b", 1200), ride("02", "c", "d", 600)],
    });

    expect(walkSeconds(withTransfer)).toBe(600);
    expect(walkSeconds(option("OPTIMAL", { totalDurationSec: 100, segments: [ride("02", "a", "b", 300)] }))).toBe(0);
  });

  it("gives the bar share of every segment, summing to one", () => {
    const shares = segmentShares(
      option("OPTIMAL", { segments: [walk(300), ride("09", "a", "b", 1200), ride("02", "c", "d", 500)] })
    );

    expect(shares[1]).toBeCloseTo(0.6);
    expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });

  it("splits a bar evenly when no segment has a duration", () => {
    expect(segmentShares(option("OPTIMAL", { segments: [ride("02", "a", "b", 0), ride("03", "c", "d", 0)] }))).toEqual([0.5, 0.5]);
  });
});

describe("next train", () => {
  const train = (over: Partial<NextTrain>): NextTrain => ({
    direction: "DOWN",
    headsign: "중앙보훈병원",
    arrivalInSec: 120,
    message: "",
    isExpress: false,
    ...over,
  });

  it("picks the soonest train going the same way with the same express type", () => {
    const picked = pickNextTrain(
      [
        train({ arrivalInSec: 60, direction: "UP", headsign: "개화" }),
        train({ arrivalInSec: 30, isExpress: true, headsign: "급행" }),
        train({ arrivalInSec: 600 }),
        train({ arrivalInSec: 180 }),
      ],
      { direction: "DOWN", isExpress: false }
    );

    expect(picked?.arrivalInSec).toBe(180);
  });

  it("puts a train with an unknown time after the ones with a time, and returns nothing when none match", () => {
    expect(
      pickNextTrain([train({ arrivalInSec: null }), train({ arrivalInSec: 900 })], { direction: "DOWN", isExpress: false })?.arrivalInSec
    ).toBe(900);
    expect(pickNextTrain([], { direction: "DOWN", isExpress: false })).toBeUndefined();
    expect(pickNextTrain([train({})], { direction: "INNER", isExpress: false })).toBeUndefined();
  });

  it("writes the wait in minutes rounded up and says soon under a minute", () => {
    expect(formatWaiting(0)).toBe("곧 출발");
    expect(formatWaiting(59)).toBe("곧 출발");
    expect(formatWaiting(60)).toBe("1분 후 출발");
    expect(formatWaiting(61)).toBe("2분 후 출발");
    expect(formatWaiting(125)).toBe("3분 후 출발");
    expect(formatWaiting(null)).toBe("");
  });
});

describe("carInsight", () => {
  const cars = (rates: number[]): SegmentCar[] =>
    rates.map((rate, i) => ({ carNo: i + 1, rate, level: "보통", isWeakAirConditioned: false }));

  it("tells how much calmer the recommended car is than the average", () => {
    // 평균 50, 추천 칸 3번째 40 -> 20% 한산
    expect(carInsight(cars([60, 50, 40, 50]), 3)).toEqual({ averageRate: 50, betterThanAveragePercent: 20 });
  });

  it("gives no comparison when the recommended car is not calmer than the average", () => {
    expect(carInsight(cars([50, 50, 50]), 2)).toEqual({ averageRate: 50, betterThanAveragePercent: undefined });
    expect(carInsight(cars([30, 90]), 2)?.betterThanAveragePercent).toBeUndefined();
  });

  it("returns nothing without car data, which older servers and walking legs do not send", () => {
    expect(carInsight(undefined, 3)).toBeUndefined();
    expect(carInsight([], 3)).toBeUndefined();
  });

  it("copes with a recommended car that is not in the list or an empty crowd", () => {
    expect(carInsight(cars([40, 40]), 9)).toEqual({ averageRate: 40 });
    expect(carInsight(cars([0, 0]), 1)).toEqual({ averageRate: 0 });
  });
});

describe("operationLabel", () => {
  it("says nothing is announced for NORMAL, shows the notice for DISRUPTED, and hides UNKNOWN", () => {
    expect(operationLabel("NORMAL")).toEqual({ tone: "ok", text: "공지된 지연은 없어요" });
    expect(operationLabel("DISRUPTED", { title: "2호선 이대역 무정차 통과중", occurredAt: "x" })).toEqual({
      tone: "warning",
      text: "2호선 이대역 무정차 통과중",
    });
    expect(operationLabel("DISRUPTED")).toEqual({ tone: "warning", text: "운행에 이상이 있어요" });
    expect(operationLabel("UNKNOWN")).toBeUndefined();
  });
});

describe("describeDoor", () => {
  it("writes the car-door number in words", () => {
    expect(describeDoor("6-2")).toBe("6번째 칸 2번 문");
    expect(describeDoor("10-4")).toBe("10번째 칸 4번 문");
    expect(describeDoor("weird")).toBe("weird");
  });
});

describe("doorGuideLines", () => {
  it("splits a transfer into the transfer door and the elevator and stair doors", () => {
    expect(doorGuideLines({ transferDoors: ["6-2"], elevatorDoors: ["3-4"], stairDoors: ["7-1"] })).toEqual([
      "빠른 환승 6-2",
      "엘리베이터 3-4 · 계단 7-1",
    ]);
  });

  it("lists the elevator doors and the exits of an alighting station on separate lines", () => {
    expect(doorGuideLines({ elevatorDoors: ["3-4", "8-1"], stairDoors: ["2-4"], exitNos: ["2", "3"] })).toEqual([
      "엘리베이터 3-4, 8-1 · 계단 2-4",
      "출구 2, 3번",
    ]);
  });

  it("says there is no fast transfer info for a transfer without doors, even with elevator and stair lines", () => {
    expect(doorGuideLines({ transfer: true, transferDoors: [] })).toEqual([NO_FAST_TRANSFER_TEXT]);
    expect(doorGuideLines({ transfer: true, elevatorDoors: ["3-4"], stairDoors: ["7-1"] })).toEqual([
      NO_FAST_TRANSFER_TEXT,
      "엘리베이터 3-4 · 계단 7-1",
    ]);
  });

  it("does not add the no-info line to an alighting row or a transfer that has doors", () => {
    expect(doorGuideLines({ transfer: false })).toEqual([]);
    expect(doorGuideLines({ transfer: true, transferDoors: ["6-2"] })).toEqual(["빠른 환승 6-2"]);
  });

  it("leaves out stairs the server did not send and lines without values", () => {
    expect(doorGuideLines({ elevatorDoors: ["3-4"] })).toEqual(["엘리베이터 3-4"]);
    expect(doorGuideLines({ stairDoors: ["7-1"] })).toEqual(["계단 7-1"]);
    expect(doorGuideLines({})).toEqual([]);
  });
});

// 타입 검사용: 하이라이트 태그가 서버 값 7개를 모두 말로 바꾸는지 reasonText가 확인한다
const allTags: RouteHighlight[] = [
  "FASTEST",
  "FEWEST_TRANSFERS",
  "NO_TRANSFER",
  "LEAST_CROWDED",
  "LEAST_WALK",
  "CHEAPEST",
  "WEAK_AC_CAR",
];
describe("highlight phrases", () => {
  it("has words for every highlight the server can send", () => {
    for (const tag of allTags) {
      expect(reasonText([tag], ["PERSONAL"])).toEqual(expect.any(String));
    }
  });
});

describe("congestionPhrase", () => {
  it("혼잡도 단계를 말로 풀어 쓴다", () => {
    expect(congestionPhrase("혼잡")).toBe("많이 붐벼요");
    expect(congestionPhrase("보통")).toBe("적당히 붐벼요");
    expect(congestionPhrase("여유")).toBe("여유 있어요");
  });
});

describe("isEstimatedCongestion", () => {
  it("추정(MOCK)만 추정이고 통계와 출처를 모르는 응답은 통계로 본다", () => {
    expect(isEstimatedCongestion("MOCK")).toBe(true);
    expect(isEstimatedCongestion("STATISTICS")).toBe(false);
    expect(isEstimatedCongestion(undefined)).toBe(false);
  });
});

describe("congestionText", () => {
  it("통계 값은 단계와 퍼센트를 함께 쓴다", () => {
    expect(congestionText("보통", 50.6, false)).toBe("적당히 붐벼요 51%");
    expect(congestionText("여유", 12, false)).toBe("여유 있어요 12%");
  });

  it("추정 값은 퍼센트 없이 단계만 쓴다", () => {
    expect(congestionText("보통", 51, true)).toBe("적당히 붐벼요");
    expect(congestionText("혼잡", 88, true)).toBe("많이 붐벼요");
  });
});

describe("withTopicParticle", () => {
  it("받침이 있으면 은, 없으면 는을 붙인다", () => {
    expect(withTopicParticle("신분당선")).toBe("신분당선은");
    expect(withTopicParticle("공항철도")).toBe("공항철도는");
    expect(withTopicParticle("GTX-A")).toBe("GTX-A는");
  });
});

describe("선호가 둘 이상일 때 문장", () => {
  it("앞은 잇는 말, 마지막은 꾸미는 말로 이어 쓴다", () => {
    expect(reasonText(["FASTEST", "LEAST_CROWDED", "LEAST_WALK"], ["PERSONAL"], ["FAST", "UNCROWDED", "LESS_WALK"])).toBe(
      "빠르고 덜 붐비고 덜 걷는 길로 골랐어요"
    );
  });
});

const meta = (patch: Partial<RecommendationMeta> = {}): RecommendationMeta => ({
  context: "WEEKDAY_MORNING_RUSH",
  reasons: [],
  usedHistory: false,
  fareSensitive: false,
  weights: { congestion: 1.5, transferSec: 240 },
  ...patch,
});

describe("점수로 고르는 추천", () => {
  // 빠르지만 붐비는 경로(최적), 느리지만 한산한 경로(여유), 싸지만 환승이 많은 경로(최소 비용)
  const fast = option("OPTIMAL", {
    totalDurationSec: 1440,
    segments: [ride("02", "A", "B", 1440, { congestionRate: 80 })],
  });
  const calm = option("COMFORTABLE", {
    totalDurationSec: 1680,
    segments: [ride("01", "A", "B", 1680, { congestionRate: 40 })],
  });
  const cheap = option("CHEAPEST", {
    totalDurationSec: 1500,
    totalFare: 1550,
    transferCount: 3,
    segments: [ride("04", "A", "B", 1500, { congestionRate: 70 })],
  });

  it("추천 근거가 없으면(비로그인) 서버가 표시한 PERSONAL을 그대로 쓴다", () => {
    const groups = groupRouteOptions([fast, calm, cheap]);

    expect(groups.map((g) => g.recommended)).toEqual([false, false, false]);
    expect(groups.map((g) => g.title)).toEqual(["종합 최적", "여유", "최소 비용"]);
  });

  it("추천 근거가 있으면 종합 점수가 가장 좋은 후보를 추천으로 올린다", () => {
    const personal = option("PERSONAL", {
      totalDurationSec: 1560,
      segments: [ride("03", "A", "B", 1560, { congestionRate: 55 })],
    });
    const groups = groupRouteOptions([fast, calm, cheap, personal], [], meta());

    expect(groups[0].recommended).toBe(true);
    expect(groups[0].title).toBe("추천");
    expect(groups.filter((g) => g.recommended)).toHaveLength(1);
  });

  it("혼잡을 피하고 싶은 신호가 쌓이면 한산한 후보가 추천이 되고 원래 이름이 보조 문구로 남는다", () => {
    const groups = groupRouteOptions(
      [fast, calm, cheap],
      [],
      meta({ reasons: ["PREF_UNCROWDED", "PREF_WEAK_AC", "CONTEXT_RUSH", "HISTORY_COMFORT"] })
    );

    expect(groups[0].option.mode).toBe("COMFORTABLE");
    expect(groups[0].title).toBe("추천");
    expect(groups[0].alias).toBe("여유");
    expect(groups.slice(1).every((g) => g.alias === undefined)).toBe(true);
  });

  it("점수로 다른 후보가 추천이 되면 서버가 PERSONAL로 표시한 경로는 추천 카드가 아니다", () => {
    // 서울역 → 잠실: 최소 비용 경로가 점수 1위, 서버의 PERSONAL 경로는 환승이 적고 한산한 다른 경로
    const personal = option("PERSONAL", {
      totalDurationSec: 1560,
      segments: [ride("03", "A", "B", 1560, { congestionRate: 32 })],
    });
    const groups = groupRouteOptions(
      [fast, cheap, personal],
      [],
      meta({ reasons: ["PREF_FAST", "PREF_UNCROWDED"] })
    );

    expect(groups.filter((g) => g.recommended)).toHaveLength(1);
    expect(groups.filter((g) => g.title === "추천")).toHaveLength(1);
    const personalCard = groups.find((g) => g.modes.includes("PERSONAL"))!;
    if (!personalCard.recommended) expect(personalCard.title).toBe("다른 경로");
  });

  it("서버의 PERSONAL이 최고점이면 보조 문구 없이 추천이다", () => {
    const only = option("PERSONAL");
    const [group] = groupRouteOptions([only], [], meta());

    expect(group.recommended).toBe(true);
    expect(group.alias).toBeUndefined();
  });

  it("도보만 가는 후보는 추천이 되지 않고 맨 뒤에 둔다", () => {
    const walkOnly = option("ONLY_WALK", { totalDurationSec: 600, segments: [walk(600)] });
    const groups = groupRouteOptions([walkOnly, fast, calm], [], meta());

    expect(groups[groups.length - 1].option.mode).toBe("ONLY_WALK");
    expect(groups[groups.length - 1].recommended).toBe(false);
  });
});

describe("recommendationReason", () => {
  it("이동 목적과 시간대 근거를 먼저 말한다", () => {
    expect(recommendationReason(meta({ reasons: ["PURPOSE_SCHOOL", "CONTEXT_RUSH"] }), [], ["FAST"])).toBe(
      "등하교 시간이라 붐비지 않는 길로 골랐어요"
    );
    expect(recommendationReason(meta({ reasons: ["PURPOSE_COMMUTE"] }), [])).toBe(
      "출퇴근 시간이라 붐비지 않는 길로 골랐어요"
    );
    expect(recommendationReason(meta({ reasons: ["CONTEXT_RUSH"] }), [])).toBe("붐비는 시간이라 덜 붐비는 길로 골랐어요");
    expect(recommendationReason(meta({ reasons: ["CONTEXT_NIGHT"] }), [])).toBe("한산한 시간이라 빨리 가는 길로 골랐어요");
  });

  it("이력 근거를 말한다", () => {
    expect(recommendationReason(meta({ reasons: ["HISTORY_COMFORT"] }), [])).toBe("자주 고르신 여유로운 길로 골랐어요");
    expect(recommendationReason(meta({ reasons: ["HISTORY_FAST"] }), [])).toBe("자주 고르신 빠른 길로 골랐어요");
    expect(recommendationReason(meta({ reasons: ["HISTORY_CHEAP"] }), [])).toBe("요금이 적게 드는 길로 골랐어요");
  });

  it("서버 근거가 없으면 설문 취향과 맞는 장점으로 말한다", () => {
    expect(recommendationReason(meta({ reasons: ["PREF_FEW_TRANSFERS"] }), ["NO_TRANSFER"], ["FEW_TRANSFERS"])).toBe(
      "환승 적은 길로 골랐어요"
    );
  });

  it("설문이 없으면 이 후보의 장점 태그를 쓴다", () => {
    expect(recommendationReason(meta(), ["FASTEST", "NO_TRANSFER"])).toBe("가장 빨라요 · 환승 없이 가요");
  });

  it("말할 근거가 없으면 비운다", () => {
    expect(recommendationReason(meta(), [])).toBeUndefined();
    expect(recommendationReason(undefined, [])).toBeUndefined();
  });
});

describe("hasRecommendedCar", () => {
  it("추천 칸 번호가 1 이상이면 있다", () => {
    expect(hasRecommendedCar({ recommendedCarNo: 1 })).toBe(true);
    expect(hasRecommendedCar({ recommendedCarNo: 10 })).toBe(true);
  });

  it("0이면 없다(칸 수를 모르는 노선이나 도보 구간)", () => {
    expect(hasRecommendedCar({ recommendedCarNo: 0 })).toBe(false);
  });

  it("음수나 숫자가 아닌 값도 없다고 본다", () => {
    expect(hasRecommendedCar({ recommendedCarNo: -1 })).toBe(false);
    expect(hasRecommendedCar({ recommendedCarNo: Number.NaN })).toBe(false);
  });
});

it("uses the versioned server personal winner instead of recomputing it in the app", () => {
  const fast = option("OPTIMAL", { totalDurationSec: 600, totalFare: 1700, routeId: "common" });
  const personal = option("PERSONAL", { totalDurationSec: 900, totalFare: 1500, routeId: "personal" });
  const groups = groupRouteOptions([fast, personal], [], {
    context: "WEEKDAY_MIDDAY", reasons: [], fareSensitive: false, usedHistory: false,
    weights: { congestion: 0, transferSec: 0 }, modelVersion: "route-preference-v2", personalRouteId: "personal",
  });
  expect(groups[0].option.routeId).toBe("personal");
  expect(groups[0].recommended).toBe(true);
});

it("preserves personal car guidance and selection ID when a public and personal path merge", () => {
  const common = option("OPTIMAL", { routeId: "common" });
  const personal = option("PERSONAL", { routeId: "personal" });
  const groups = groupRouteOptions([common, personal], [], {
    context: "WEEKDAY_MIDDAY", reasons: [], fareSensitive: false, usedHistory: false,
    weights: { congestion: 0, transferSec: 0 }, modelVersion: "route-preference-v2", personalRouteId: "personal",
  });
  expect(groups).toHaveLength(1);
  expect(groups[0].option).toBe(personal);
  expect(groups[0].modes).toEqual(["PERSONAL", "OPTIMAL"]);
});
