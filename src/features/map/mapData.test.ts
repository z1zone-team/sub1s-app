import type { LineMapResponseDto } from "@/apis/queries/profile/getLineMap";
import { buildMapHtml } from "./mapHtml";
import { homeMapData, visitedLineIds, visitedMapData } from "./mapData";

const station = (id: string, seq: number, visited: boolean) => ({
  stationId: id,
  stationName: id,
  lineSeq: seq,
  lat: 37 + seq / 100,
  lng: 127 + seq / 100,
  visited,
});

const lineMap = {
  userId: "u",
  period: "ALL",
  lines: [
    { lineId: "09", lineName: "9호선", colorHex: "#BDB092", stations: [station("a", 1, true), station("b", 2, true), station("c", 3, false), station("d", 4, true), station("e", 5, true), station("f", 6, true)] },
    { lineId: "03", lineName: "3호선", colorHex: "#EF7C1C", stations: [station("g", 2, true), station("h", 1, true)] },
    { lineId: "01", lineName: "1호선", colorHex: "#0052A4", stations: [station("x", 1, false)] },
  ],
} as unknown as LineMapResponseDto;

describe("visitedMapData", () => {
  it("방문한 역을 이어 선으로 만들고 방문하지 않은 역에서 끊는다", () => {
    const data = visitedMapData(lineMap);
    const line9 = data.lines.filter((line) => line.color === "#BDB092");
    expect(line9.map((line) => line.points.length)).toEqual([2, 3]);
  });

  it("호선 순서(lineSeq)대로 정렬해서 잇는다", () => {
    const line3 = visitedMapData(lineMap).lines.find((line) => line.color === "#EF7C1C");
    expect(line3?.points[0]).toEqual([37.01, 127.01]);
  });

  it("방문한 역마다 점을 찍는다", () => {
    expect(visitedMapData(lineMap).markers).toHaveLength(7);
  });

  it("호선을 고르면 다른 호선은 흐리게 그린다", () => {
    const data = visitedMapData(lineMap, "09");
    expect(data.lines.filter((line) => line.color === "#BDB092").every((line) => line.opacity === 1)).toBe(true);
    expect(data.lines.filter((line) => line.color === "#EF7C1C").every((line) => line.opacity === 0.25)).toBe(true);
  });

  it("방문한 역이 없으면 빈 지도이고 맞추지 않는다", () => {
    expect(visitedMapData(undefined)).toEqual({ lines: [], markers: [], fit: false });
  });
});

describe("visitedLineIds", () => {
  it("방문한 역이 있는 호선만 돌려준다", () => {
    expect(visitedLineIds(lineMap)).toEqual(["09", "03"]);
  });
});

describe("homeMapData", () => {
  it("내 위치가 있으면 내 위치 마커 하나만 두고 그 주변을 보여 준다", () => {
    const data = homeMapData({ me: { lat: 37.5, lng: 127 } });
    expect(data.fit).toBe(false);
    expect(data.center).toEqual([37.5, 127]);
    expect(data.markers).toHaveLength(1);
    expect(data.markers[0].kind).toBe("me");
  });

  it("내 위치만 있어도, 고른 장소가 있어도 처음 확대 수준은 16이다", () => {
    expect(homeMapData({ me: { lat: 37.5, lng: 127 } }).zoom).toBe(16);
    expect(homeMapData({ me: { lat: 37.5, lng: 127 }, pin: { lat: 37.56, lng: 126.97 } }).zoom).toBe(16);
  });

  it("고른 장소가 있으면 핀을 더하고 그곳을 중심으로 보여 준다", () => {
    const data = homeMapData({ me: { lat: 37.5, lng: 127 }, pin: { lat: 37.56, lng: 126.97 } });
    expect(data.markers.map((marker) => marker.kind)).toEqual(["me", "pin"]);
    expect(data.center).toEqual([37.56, 126.97]);
    expect(data.zoom).toBe(16);
  });

  it("내 위치 없이 고른 장소만 있어도 핀을 보여 준다", () => {
    const data = homeMapData({ pin: { lat: 37.56, lng: 126.97 } });
    expect(data.markers).toHaveLength(1);
    expect(data.center).toEqual([37.56, 126.97]);
  });

  it("내 위치가 없으면 마커 없이 기본 위치를 보여 준다", () => {
    const data = homeMapData({});
    expect(data.markers).toEqual([]);
    expect(data.center).toBeUndefined();
    expect(data.fit).toBe(false);
  });
});
