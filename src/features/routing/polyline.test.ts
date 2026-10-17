import { decodePolyline } from "./polyline";

/** 테스트에서만 쓰는 인코더. 구글 폴리라인 규칙 그대로 위도, 경도의 변화량을 5자리 정수로 바꿔 적는다 */
function encodePolyline(points: Array<[number, number]>): string {
  let previousLat = 0;
  let previousLng = 0;
  const encodeValue = (value: number): string => {
    let remaining = value < 0 ? ~(value << 1) : value << 1;
    let chunk = "";
    while (remaining >= 0x20) {
      chunk += String.fromCharCode((0x20 | (remaining & 0x1f)) + 63);
      remaining >>= 5;
    }
    return chunk + String.fromCharCode(remaining + 63);
  };
  return points
    .map(([lat, lng]) => {
      const scaledLat = Math.round(lat * 1e5);
      const scaledLng = Math.round(lng * 1e5);
      const encoded = encodeValue(scaledLat - previousLat) + encodeValue(scaledLng - previousLng);
      previousLat = scaledLat;
      previousLng = scaledLng;
      return encoded;
    })
    .join("");
}

describe("decodePolyline", () => {
  it("구글 문서의 예시 선을 위도, 경도 점으로 푼다", () => {
    expect(decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@")).toEqual([
      [38.5, -120.2],
      [40.7, -120.95],
      [43.252, -126.453],
    ]);
  });

  it("한 점짜리 선도 푼다", () => {
    expect(decodePolyline("_p~iF~ps|U")).toEqual([[38.5, -120.2]]);
  });

  it("빈 문자열은 빈 목록이다", () => {
    expect(decodePolyline("")).toEqual([]);
  });

  it("끝이 잘려 위도만 있고 경도가 없으면 빈 목록이다", () => {
    expect(decodePolyline("_p~iF")).toEqual([]);
  });

  it("범위를 넘는 값이나 허용되지 않은 글자가 있으면 빈 목록이다", () => {
    expect(decodePolyline("____________")).toEqual([]);
    expect(decodePolyline("서울")).toEqual([]);
  });

  it("인코딩한 한국 좌표를 소수점 다섯 자리까지 그대로 되돌린다", () => {
    const route: Array<[number, number]> = [
      [37.40919, 127.25285],
      [37.40855, 127.25301],
      [37.39972, 127.2525],
    ];
    expect(decodePolyline(encodePolyline(route))).toEqual(route);
  });
});
