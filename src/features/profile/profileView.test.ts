import {
  isVisibilityOn,
  nameError,
  nicknameError,
  percentileText,
  sumDistanceKm,
  toggledVisibility,
  VISIBILITY_OPTIONS,
  visibilityDescription,
  weekBars,
  weekdayLabel,
} from "./profileView";

describe("nicknameError", () => {
  it("규칙에 맞으면 빈 문구다", () => {
    expect(nicknameError("내출신은리")).toBe("");
    expect(nicknameError("Rider_1.a-b")).toBe("");
  });

  it("2자 미만, 20자 초과는 길이 안내가 나온다", () => {
    expect(nicknameError("가")).toContain("2~20자");
    expect(nicknameError("가".repeat(21))).toContain("2~20자");
  });

  it("공백과 특수문자는 안 된다", () => {
    expect(nicknameError("a b")).toContain("공백");
    expect(nicknameError("a!b")).toContain("공백");
  });

  it("앞뒤 공백은 무시하고 검사한다", () => {
    expect(nicknameError(" 지하철 ")).toBe("");
  });
});

describe("nameError", () => {
  it("30자까지 허용한다", () => {
    expect(nameError("가".repeat(30))).toBe("");
    expect(nameError("가".repeat(31))).not.toBe("");
  });
});

describe("percentileText", () => {
  it("값이 있으면 상위 퍼센트를 보여 준다", () => {
    expect(percentileText(12)).toBe("이번 달 상위 12%");
  });

  it("값이 없으면 보여 주지 않는다", () => {
    expect(percentileText(undefined)).toBe("");
  });
});

describe("주간 막대", () => {
  it("날짜 문자열로 요일을 구한다", () => {
    expect(weekdayLabel("2026-10-11")).toBe("일");
    expect(weekdayLabel("2026-10-12")).toBe("월");
    expect(weekdayLabel("bad")).toBe("");
  });

  it("가장 많이 이동한 날을 1로 맞춘다", () => {
    const bars = weekBars([
      { key: "2026-10-10", distanceKm: 5, rideCount: 1 },
      { key: "2026-10-11", distanceKm: 10, rideCount: 2 },
    ]);
    expect(bars.map((bar) => bar.ratio)).toEqual([0.5, 1]);
    expect(bars.map((bar) => bar.label)).toEqual(["토", "일"]);
  });

  it("이동이 없으면 모두 0이고 막대가 없으면 빈 목록이다", () => {
    expect(weekBars([{ key: "2026-10-11", distanceKm: 0, rideCount: 0 }])[0].ratio).toBe(0);
    expect(weekBars(undefined)).toEqual([]);
  });

  it("거리를 합산한다", () => {
    expect(
      sumDistanceKm([
        { key: "a", distanceKm: 1.5, rideCount: 1 },
        { key: "b", distanceKm: 2, rideCount: 1 },
      ])
    ).toBe(3.5);
    expect(sumDistanceKm(undefined)).toBe(0);
  });
});

describe("VISIBILITY_OPTIONS", () => {
  it("서버의 세 단계와 같다", () => {
    expect(VISIBILITY_OPTIONS.map((option) => option.value)).toEqual(["PUBLIC", "ANONYMOUS", "PRIVATE"]);
  });
});

describe("공개 스위치", () => {
  it("공개와 익명은 켜짐, 비공개는 꺼짐이다", () => {
    expect(isVisibilityOn("PUBLIC")).toBe(true);
    expect(isVisibilityOn("ANONYMOUS")).toBe(true);
    expect(isVisibilityOn("PRIVATE")).toBe(false);
  });

  it("켜짐을 누르면 비공개, 꺼짐을 누르면 공개가 된다", () => {
    expect(toggledVisibility("PUBLIC")).toBe("PRIVATE");
    expect(toggledVisibility("ANONYMOUS")).toBe("PRIVATE");
    expect(toggledVisibility("PRIVATE")).toBe("PUBLIC");
  });

  it("상태마다 설명이 있다", () => {
    expect(visibilityDescription("PUBLIC")).toBe("친구에게 이동 거리와 랭킹이 보여요");
    expect(visibilityDescription("PRIVATE")).toBe("나만 볼 수 있어요 · 랭킹에서 숨김");
  });
});
