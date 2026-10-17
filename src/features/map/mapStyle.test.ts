import {
  DEFAULT_MAP_STYLE,
  isMapStyle,
  isWebGlMode,
  LABEL_OVERLAY_LAYER,
  MAP_STYLE_OPTIONS,
  modeButtonAccessibilityLabel,
  modeButtonLabel,
  nextMapMode,
  tileLayerOf,
} from "./mapStyle";

describe("지도 모드", () => {
  it("2D, 3D, 실제(위성) 순서로 돌고 위성 다음은 다시 2D다", () => {
    expect(nextMapMode("2D")).toBe("3D");
    expect(nextMapMode("3D")).toBe("SATELLITE");
    expect(nextMapMode("SATELLITE")).toBe("2D");
  });

  it("버튼에는 눌렀을 때 가는 모드를 보여 준다", () => {
    expect(modeButtonLabel("2D")).toBe("3D");
    expect(modeButtonLabel("3D")).toBe("실제");
    expect(modeButtonLabel("SATELLITE")).toBe("2D");
  });

  it("접근성 라벨도 가는 모드를 말한다", () => {
    expect(modeButtonAccessibilityLabel("2D")).toBe("지도를 3D로 전환");
    expect(modeButtonAccessibilityLabel("3D")).toBe("지도를 실제(위성)로 전환");
    expect(modeButtonAccessibilityLabel("SATELLITE")).toBe("지도를 2D로 전환");
  });

  it("3D만 WebGL 지도다", () => {
    expect(isWebGlMode("3D")).toBe(true);
    expect(isWebGlMode("2D")).toBe(false);
    expect(isWebGlMode("SATELLITE")).toBe(false);
  });
});

describe("지도 스타일", () => {
  it("기본은 일반이다", () => {
    expect(DEFAULT_MAP_STYLE).toBe("BASIC");
  });

  it("일반, 라이트, 다크 세 가지를 고를 수 있다", () => {
    expect(MAP_STYLE_OPTIONS.map((option) => option.value)).toEqual(["BASIC", "LIGHT", "DARK"]);
    expect(MAP_STYLE_OPTIONS.map((option) => option.label)).toEqual(["일반", "라이트", "다크"]);
  });

  it("저장된 값이 지도 스타일인지 가려낸다", () => {
    expect(isMapStyle("DARK")).toBe(true);
    expect(isMapStyle("dark")).toBe(false);
    expect(isMapStyle(undefined)).toBe(false);
  });
});

describe("tileLayerOf", () => {
  it("2D와 3D는 스타일에 따라 Base, white, midnight 타일이다", () => {
    for (const mode of ["2D", "3D"] as const) {
      expect(tileLayerOf(mode, "BASIC")).toEqual({ name: "Base", extension: "png" });
      expect(tileLayerOf(mode, "LIGHT")).toEqual({ name: "white", extension: "png" });
      expect(tileLayerOf(mode, "DARK")).toEqual({ name: "midnight", extension: "png" });
    }
  });

  it("실제(위성)는 스타일과 상관없이 Satellite jpeg다", () => {
    for (const style of ["BASIC", "LIGHT", "DARK"] as const) {
      expect(tileLayerOf("SATELLITE", style)).toEqual({ name: "Satellite", extension: "jpeg" });
    }
  });

  it("위성 위의 지명 레이어는 Hybrid png다", () => {
    expect(LABEL_OVERLAY_LAYER).toEqual({ name: "Hybrid", extension: "png" });
  });
});
