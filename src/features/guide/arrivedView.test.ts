import { valueParts } from "./arrivedView";

describe("valueParts", () => {
  it("숫자와 단위를 나눈다", () => {
    expect(valueParts("14.6km")).toEqual([{ number: "14.6", unit: "km" }]);
    expect(valueParts("33분")).toEqual([{ number: "33", unit: "분" }]);
    expect(valueParts("0회")).toEqual([{ number: "0", unit: "회" }]);
  });

  it("시간과 분이 함께 있으면 두 쌍으로 나눈다", () => {
    expect(valueParts("1시간 5분")).toEqual([
      { number: "1", unit: "시간" },
      { number: "5", unit: "분" },
    ]);
  });

  it("미터 단위도 나눈다", () => {
    expect(valueParts("800m")).toEqual([{ number: "800", unit: "m" }]);
  });

  it("나눌 수 없으면 값 전체를 숫자 자리에 둔다", () => {
    expect(valueParts("-")).toEqual([{ number: "-", unit: "" }]);
  });
});
