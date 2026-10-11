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
  it("내 위치가 있으면 그 주변을 보여 준다", () => {
    const data = homeMapData({ me: { lat: 37.5, lng: 127 }, recents: [{ name: "강남", lat: 37.49, lng: 127.02 }] });
    expect(data.fit).toBe(false);
    expect(data.center).toEqual([37.5, 127]);
    expect(data.markers).toHaveLength(2);
  });

  it("내 위치가 없으면 도착지가 모두 보이게 맞춘다", () => {
    const data = homeMapData({ recents: [{ name: "강남", lat: 37.49, lng: 127.02 }] });
    expect(data.fit).toBe(true);
    expect(data.center).toBeUndefined();
  });

  it("아무것도 없으면 맞추지 않는다", () => {
    expect(homeMapData({ recents: [] }).fit).toBe(false);
  });
});

describe("buildMapHtml", () => {
  it("V-World 타일 주소에 키를 넣는다", () => {
    expect(buildMapHtml("ABC-123")).toContain("api.vworld.kr/req/wmts/1.0.0/ABC-123/Base/{z}/{y}/{x}.png");
  });

  it("키의 특수문자를 인코딩한다", () => {
    expect(buildMapHtml("a b/c")).toContain("a%20b%2Fc");
  });

  it("버전을 고정한 Leaflet을 쓴다", () => {
    expect(buildMapHtml("k")).toContain("leaflet/1.9.4/leaflet.min.js");
  });
});
