import { canProceed, PURPOSES, ROUTE_PREFS, toggleSelection } from "./options";

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
      "FAST", "FEW_TRANSFERS", "WEAK_AC", "UNCROWDED", "LESS_WALK", "SEAT", "ELEVATOR",
    ]);
  });
});
