/** 방향 값이 이만큼(도) 넘게 바뀔 때만 새 값으로 본다. 나침반 센서가 떨려서 화면이 계속 흔들리는 것을 막는다(부채꼴이 뚝뚝 끊겨 보이지 않을 만큼 작게 둔다) */
export const HEADING_MIN_CHANGE_DEG = 0.5;

/** 나침반이 알려 주는 값에서 지도에 쓸 방향(북쪽 0도, 시계 방향)을 고른다. 진북을 우선하고 모르면(-1) 자북을 쓴다 */
export function pickHeading(heading: { trueHeading: number; magHeading: number }): number | null {
  const value = heading.trueHeading >= 0 ? heading.trueHeading : heading.magHeading;
  return Number.isFinite(value) && value >= 0 ? value % 360 : null;
}

/** 두 방향의 차이(0~180도). 359도와 1도는 2도 차이다 */
export function headingDifference(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/** 이전 방향이 없거나 충분히 바뀌었을 때만 true */
export function shouldUpdateHeading(previous: number | null, next: number): boolean {
  return previous === null || headingDifference(previous, next) >= HEADING_MIN_CHANGE_DEG;
}

const DEG = 180 / Math.PI;

/**
 * 기기 회전 센서(DeviceMotion)의 회전값에서 폰이 가리키는 방향(자북 기준, 북쪽 0도, 시계 방향)을 구한다.
 * 값은 라디안이고 alpha는 안드로이드 방위각의 부호를 바꾼 값, beta는 피치의 부호를 바꾼 값, gamma는 롤이다(expo-sensors 안드로이드 구현).
 * 폰을 눕혀 들면 윗면이 향하는 쪽을, 세워 들면 뒷면(카메라)이 향하는 쪽을 쓴다. 두 벡터를 더하면 기울기에 따라 자연스럽게 섞인다.
 * 어느 쪽도 수평 성분이 없으면(바닥을 똑바로 보고 있는 등) null이다
 */
export function headingFromRotation(rotation: { alpha: number; beta: number; gamma: number }): number | null {
  const azimuth = -rotation.alpha;
  const pitch = -rotation.beta;
  const roll = rotation.gamma;
  const c = Math.cos(azimuth);
  const s = Math.sin(azimuth);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const cr = Math.cos(roll);
  const sr = Math.sin(roll);

  // 윗면(y축)과 화면에서 나오는 축(z축)이 가리키는 동쪽, 북쪽 성분
  const topEast = s * cp;
  const topNorth = c * cp;
  const outEast = c * sr + s * sp * cr;
  const outNorth = -s * sr + c * sp * cr;

  const east = topEast - outEast;
  const north = topNorth - outNorth;
  if (Math.hypot(east, north) < 1e-3) return null;
  return (Math.atan2(east, north) * DEG + 360) % 360;
}

/** 자북과 진북의 차이(도, -180~180). 진북 방향을 모르면(-1) null이다. 진북 = 자북 + 편차 */
export function declinationOf(heading: { trueHeading: number; magHeading: number }): number | null {
  if (!(heading.trueHeading >= 0) || !(heading.magHeading >= 0)) return null;
  return ((heading.trueHeading - heading.magHeading + 540) % 360) - 180;
}

/** 방향에 편차를 더해 0~360도로 맞춘다 */
export function addDeclination(heading: number, declination: number): number {
  return (((heading + declination) % 360) + 360) % 360;
}
