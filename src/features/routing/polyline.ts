/**
 * 구글 인코딩 폴리라인(정밀도 5)을 [위도, 경도] 점 목록으로 푼다. 서버가 도보 구간의 실제 보행 경로 선(`path`)으로 준다.
 * 형식이 맞지 않으면(끝이 잘렸거나 범위를 벗어남) 빈 목록이라 호출한 쪽이 직선으로 그린다
 */
export function decodePolyline(encoded: string): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  const nextValue = (): number | undefined => {
    let result = 0;
    let shift = 0;
    for (;;) {
      if (index >= encoded.length) return undefined;
      const byte = encoded.charCodeAt(index) - 63;
      index += 1;
      if (byte < 0 || byte > 63) return undefined;
      result += (byte & 0x1f) * 2 ** shift;
      shift += 5;
      if (byte < 0x20) break;
    }
    return result % 2 === 1 ? -(result + 1) / 2 : result / 2;
  };

  while (index < encoded.length) {
    const dLat = nextValue();
    const dLng = nextValue();
    if (dLat === undefined || dLng === undefined) return [];
    lat += dLat;
    lng += dLng;
    if (Math.abs(lat) > 9_000_000 || Math.abs(lng) > 18_000_000) return [];
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}
