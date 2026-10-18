/** 홈 지도 모드. 일반 지도(2D), 3D, 실제(위성 사진) */
export type MapMode = "2D" | "3D" | "SATELLITE";

/** 설정에서 고르는 지도 스타일. V-World의 Base, white, midnight 타일이다 */
export type MapStyle = "BASIC" | "LIGHT" | "DARK";

export const DEFAULT_MAP_STYLE: MapStyle = "BASIC";

const MODE_ORDER: readonly MapMode[] = ["2D", "3D", "SATELLITE"];

/** 모드 버튼을 누를 때마다 2D, 3D, 실제(위성) 순서로 돈다 */
export function nextMapMode(mode: MapMode): MapMode {
  return MODE_ORDER[(MODE_ORDER.indexOf(mode) + 1) % MODE_ORDER.length];
}

/** 모드 버튼에 보이는 글자. 지금 모드가 아니라 눌렀을 때 가는 모드를 보여 준다 */
export function modeButtonLabel(mode: MapMode): string {
  const next = nextMapMode(mode);
  return next === "SATELLITE" ? "실제" : next;
}

/** 모드 버튼의 접근성 라벨 */
export function modeButtonAccessibilityLabel(mode: MapMode): string {
  const next = nextMapMode(mode);
  return `지도를 ${next === "SATELLITE" ? "실제(위성)" : next}로 전환`;
}

export const MAP_STYLE_OPTIONS: ReadonlyArray<{ value: MapStyle; label: string; description: string }> = [
  { value: "BASIC", label: "일반", description: "기본 컬러 지도" },
  { value: "LIGHT", label: "라이트", description: "밝고 단순한 지도" },
  { value: "DARK", label: "다크", description: "어두운 지도" },
];

export function isMapStyle(value: unknown): value is MapStyle {
  return value === "BASIC" || value === "LIGHT" || value === "DARK";
}

export interface TileLayerName {
  /** V-World 타일 주소의 레이어 이름 */
  name: string;
  extension: "png" | "jpeg";
}

const STYLE_LAYER: Record<MapStyle, string> = { BASIC: "Base", LIGHT: "white", DARK: "midnight" };

/** 모드와 스타일에 맞는 V-World 타일 레이어. 실제(위성)는 스타일과 상관없다 */
export function tileLayerOf(mode: MapMode, style: MapStyle): TileLayerName {
  if (mode === "SATELLITE") return { name: "Satellite", extension: "jpeg" };
  return { name: STYLE_LAYER[style], extension: "png" };
}

/** 위성 사진 위에 겹쳐 지명을 보이는 레이어. 실제(위성) 모드에서만 쓴다 */
export const LABEL_OVERLAY_LAYER: TileLayerName = { name: "Hybrid", extension: "png" };

/** 3D만 WebGL 지도다. 실제(위성)는 3D가 아니라 2D 위성 사진으로 보여 준다 */
export function isWebGlMode(mode: MapMode): boolean {
  return mode === "3D";
}

/** 위성 사진과 라이트(white) 타일에는 지명이 없어 이름 레이어를 겹친다 */
export function needsLabelOverlay(mode: MapMode, style: MapStyle): boolean {
  return mode === "SATELLITE" || style === "LIGHT";
}
