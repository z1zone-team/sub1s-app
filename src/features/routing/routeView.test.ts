import type {
  PathSegmentDto,
  RouteHighlight,
  RouteMode,
  SegmentCar,
  SubwayRouteOptionDto,
} from "@/apis/queries/routing/searchRoutes";
import type { NextTrain } from "@/apis/queries/stations/getNextTrains";
import {
  carInsight,
  congestionPhrase,
  clockRange,
  describeDoor,
  formatWaiting,
  groupRouteOptions,
  matchedPreferences,
  operationLabel,
  pickNextTrain,
  reasonText,
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

  it("keeps different routes apart, with the recommended one first and the rest in mode order", () => {
    const fast = option("OPTIMAL", { totalDurationSec: 1800 });
    const calm = option("COMFORTABLE", { totalDurationSec: 2400 });
    const cheap = option("CHEAPEST", { totalDurationSec: 2700, totalFare: 1650 });
    const personal = option("PERSONAL", { totalDurationSec: 2040 });

    const groups = groupRouteOptions([fast, calm, personal, cheap]);

    expect(groups.map((g) => g.title)).toEqual(["추천", "최적", "여유", "최소 비용"]);
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

    expect(groups.map((g) => g.title)).toEqual(["최적", "도보"]);
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
    expect(reasonText(["FASTEST"], ["OPTIMAL"], ["UNCROWDED"])).toBe("가장 빨리 도착해요");
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
