import {
  composeDeparture,
  departureDays,
  departureText,
  earliestDeparture,
  isSelectableDeparture,
  kstDayStart,
  splitDeparture,
} from "./departureTime";

// 2026-10-19 14:17 KST = 2026-10-19 05:17 UTC
const NOW = Date.parse("2026-10-19T05:17:00Z");
const MIDNIGHT = Date.parse("2026-10-18T15:00:00Z"); // 2026-10-19 00:00 KST

describe("kstDayStart", () => {
  it("한국 시간 기준 그날 0시를 돌려준다", () => {
    expect(kstDayStart(NOW)).toBe(MIDNIGHT);
  });

  it("한국 시간으로 자정 직전과 직후는 다른 날이다", () => {
    expect(kstDayStart(Date.parse("2026-10-19T14:59:00Z"))).toBe(MIDNIGHT);
    expect(kstDayStart(Date.parse("2026-10-19T15:01:00Z"))).toBe(MIDNIGHT + 24 * 60 * 60 * 1000);
  });
});

describe("departureDays", () => {
  const days = departureDays(NOW);

  it("오늘부터 7일을 주고 앞의 둘은 오늘, 내일이다", () => {
    expect(days).toHaveLength(7);
    expect(days[0]).toEqual({ startMs: MIDNIGHT, label: "오늘" });
    expect(days[1].label).toBe("내일");
  });

  it("그 뒤는 월/일과 요일이다", () => {
    expect(days[2].label).toBe("10/21(수)");
    expect(days[6].label).toBe("10/25(일)");
  });

  it("달이 바뀌어도 이어진다", () => {
    const end = departureDays(Date.parse("2026-10-30T05:00:00Z"));
    expect(end[2].label).toBe("11/1(일)");
  });
});

describe("composeDeparture와 splitDeparture", () => {
  const days = departureDays(NOW);

  it("날짜와 시, 분으로 시각을 만든다", () => {
    expect(composeDeparture(days[1].startMs, 8, 30)).toBe(Date.parse("2026-10-20T08:30:00+09:00"));
  });

  it("만든 시각을 다시 나누면 같은 값이다", () => {
    expect(splitDeparture(composeDeparture(days[2].startMs, 23, 55), days)).toEqual({ dayIndex: 2, hour: 23, minute: 55 });
  });

  it("후보 밖의 날짜는 -1이다", () => {
    expect(splitDeparture(composeDeparture(days[0].startMs - 24 * 60 * 60 * 1000, 9, 0), days).dayIndex).toBe(-1);
  });
});

describe("earliestDeparture와 isSelectableDeparture", () => {
  it("지금 이후 가장 가까운 5분 단위로 올린다", () => {
    expect(earliestDeparture(NOW)).toBe(Date.parse("2026-10-19T14:20:00+09:00"));
    expect(earliestDeparture(Date.parse("2026-10-19T14:20:00+09:00"))).toBe(Date.parse("2026-10-19T14:20:00+09:00"));
  });

  it("지금이 속한 5분 칸까지는 고를 수 있고 그보다 이르면 못 고른다", () => {
    expect(isSelectableDeparture(Date.parse("2026-10-19T14:15:00+09:00"), NOW)).toBe(true);
    expect(isSelectableDeparture(Date.parse("2026-10-19T14:10:00+09:00"), NOW)).toBe(false);
    expect(isSelectableDeparture(Date.parse("2026-10-19T14:20:00+09:00"), NOW)).toBe(true);
    expect(isSelectableDeparture(Date.parse("2026-10-18T23:00:00+09:00"), NOW)).toBe(false);
  });
});

describe("departureText", () => {
  it("오늘이면 오늘, 내일이면 내일, 그 뒤는 월일이다", () => {
    expect(departureText(NOW, NOW)).toBe("오늘 14:17 출발");
    expect(departureText(Date.parse("2026-10-20T08:30:00+09:00"), NOW)).toBe("내일 08:30 출발");
    expect(departureText(Date.parse("2026-10-23T09:05:00+09:00"), NOW)).toBe("10월 23일 09:05 출발");
  });

  it("한국 시간으로 날짜가 바뀌는 자정 근처를 정확히 가른다", () => {
    expect(departureText(Date.parse("2026-10-19T23:55:00+09:00"), NOW)).toBe("오늘 23:55 출발");
    expect(departureText(Date.parse("2026-10-20T00:00:00+09:00"), NOW)).toBe("내일 00:00 출발");
  });
});
