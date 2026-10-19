import { addDeclination, declinationOf, headingDifference, headingFromRotation, pickHeading, shouldUpdateHeading } from "./heading";

describe("pickHeading", () => {
  it("진북이 있으면 진북을, 모르면(-1) 자북을 쓴다", () => {
    expect(pickHeading({ trueHeading: 90, magHeading: 80 })).toBe(90);
    expect(pickHeading({ trueHeading: -1, magHeading: 80 })).toBe(80);
  });

  it("둘 다 모르면 null이다", () => {
    expect(pickHeading({ trueHeading: -1, magHeading: -1 })).toBeNull();
    expect(pickHeading({ trueHeading: Number.NaN, magHeading: Number.NaN })).toBeNull();
  });

  it("360도 이상은 0~359로 줄인다", () => {
    expect(pickHeading({ trueHeading: 365, magHeading: 0 })).toBe(5);
  });
});

describe("headingDifference", () => {
  it("359도와 1도는 2도 차이다", () => {
    expect(headingDifference(359, 1)).toBe(2);
    expect(headingDifference(10, 200)).toBe(170);
  });
});

describe("shouldUpdateHeading", () => {
  it("처음이거나 0.5도 이상 바뀌었을 때만 새 값으로 본다", () => {
    expect(shouldUpdateHeading(null, 10)).toBe(true);
    expect(shouldUpdateHeading(10, 10.4)).toBe(false);
    expect(shouldUpdateHeading(10, 11)).toBe(true);
    expect(shouldUpdateHeading(359.8, 0)).toBe(false);
  });
});

describe("headingFromRotation", () => {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  // expo-sensors 안드로이드: alpha = -방위각, beta = -피치, gamma = 롤
  const rotation = (azimuth: number, pitch: number, roll: number) => ({ alpha: -rad(azimuth), beta: -rad(pitch), gamma: rad(roll) });

  it("눕혀 들면 윗면이 향하는 방위각이 방향이다", () => {
    expect(headingFromRotation(rotation(0, 0, 0))).toBeCloseTo(0);
    expect(headingFromRotation(rotation(90, 0, 0))).toBeCloseTo(90);
    expect(headingFromRotation(rotation(270, 0, 0))).toBeCloseTo(270);
  });

  it("세워 들면 뒷면(카메라)이 향하는 쪽이 방향이다", () => {
    expect(headingFromRotation(rotation(45, -90, 0))).toBeCloseTo(45);
    expect(headingFromRotation(rotation(200, -90, 0))).toBeCloseTo(200);
  });

  it("비스듬히 들어도 같은 방향이다", () => {
    expect(headingFromRotation(rotation(30, -45, 0))).toBeCloseTo(30);
  });

  it("윗면과 뒷면이 서로 반대로 가리켜 수평 성분이 상쇄되면 null이다", () => {
    expect(headingFromRotation(rotation(0, 45, 0))).toBeNull();
  });
});

describe("declination", () => {
  it("진북과 자북의 차이를 구하고 방향에 더한다", () => {
    expect(declinationOf({ trueHeading: 82, magHeading: 90 })).toBe(-8);
    expect(declinationOf({ trueHeading: 2, magHeading: 355 })).toBe(7);
    expect(declinationOf({ trueHeading: -1, magHeading: 90 })).toBeNull();
    expect(addDeclination(5, -8)).toBe(357);
    expect(addDeclination(350, 15)).toBe(5);
  });
});
