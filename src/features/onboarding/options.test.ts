import { canProceed, nextStep, PURPOSES, ROUTE_PREFS, toggleSelection, totalSteps, unsupportedPreferenceNotice } from "./options";

describe("toggleSelection", () => {
  it("고르지 않은 항목은 뒤에 더한다", () => {
    expect(toggleSelection(["COMMUTE"], "SCHOOL")).toEqual(["COMMUTE", "SCHOOL"]);
  });

  it("이미 고른 항목은 뺀다", () => {
    expect(toggleSelection(["COMMUTE", "SCHOOL"], "COMMUTE")).toEqual(["SCHOOL"]);
  });
});

describe("canProceed", () => {
  it("1단계는 용무를 하나 이상 골라야 한다", () => {
    expect(canProceed(1, [], ["FAST"])).toBe(false);
    expect(canProceed(1, ["TRAVEL"], [])).toBe(true);
  });

  it("2단계는 경로 취향을 하나 이상 골라야 한다", () => {
    expect(canProceed(2, ["TRAVEL"], [])).toBe(false);
    expect(canProceed(2, [], ["FAST"])).toBe(true);
  });
});

describe("선택지", () => {
  it("서버 코드와 같은 값을 쓴다", () => {
    expect(PURPOSES.map((option) => option.code)).toEqual([
      "COMMUTE", "SCHOOL", "MEETING", "TRAVEL", "EXERCISE", "SHOPPING", "HOSPITAL", "DATE",
    ]);
    expect(ROUTE_PREFS.map((option) => option.code)).toEqual([
      "FAST", "FEW_TRANSFERS", "WEAK_AC", "UNCROWDED", "LESS_WALK", "SEAT", "ELEVATOR", "LOW_FARE", "AVOID_STAIRS", "EXPRESS", "FAMILIAR_ROUTE",
    ]);
  });
});

describe("unsupportedPreferenceNotice", () => {
  it("서버가 보내는 반영 못 한 선호를 이름으로 이어 붙인다", () => {
    expect(unsupportedPreferenceNotice(["SEAT", "ELEVATOR", "AVOID_STAIRS"])).toBe(
      "아직 반영하지 못한 선호: 앉아서 가기 · 엘리베이터 있는 역 · 계단 피하기",
    );
  });

  it("없거나 비었거나 이름을 모르는 코드뿐이면 문구를 만들지 않는다", () => {
    expect(unsupportedPreferenceNotice(undefined)).toBeNull();
    expect(unsupportedPreferenceNotice([])).toBeNull();
    expect(unsupportedPreferenceNotice(["UNKNOWN"])).toBeNull();
  });

  it("이름을 아는 코드만 남긴다", () => {
    expect(unsupportedPreferenceNotice(["UNKNOWN", "FAMILIAR_ROUTE"])).toBe("아직 반영하지 못한 선호: 익숙한 경로");
  });
});

describe("onboarding steps", () => {
  it("처음 설문은 닉네임까지 3단계이고 수정 모드는 2단계다", () => {
    expect(totalSteps(false)).toBe(3);
    expect(totalSteps(true)).toBe(2);
  });

  it("마지막 단계 다음은 없다", () => {
    expect(nextStep(1, false)).toBe(2);
    expect(nextStep(2, false)).toBe(3);
    expect(nextStep(3, false)).toBeNull();
    expect(nextStep(2, true)).toBeNull();
  });

  it("닉네임 단계는 설문 선택과 상관없이 넘어갈 수 있다(닉네임은 화면에서 검사)", () => {
    expect(canProceed(3, [], [])).toBe(true);
  });
});
