import type { LineMapResponseDto } from "@/apis/queries/profile/getLineMap";
import { buildMapHtml } from "./mapHtml";
import { homeMapData, tripMapData, visitedLineIds, visitedMapData } from "./mapData";

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

  it("내 위치 마커에 캐릭터의 표정을 싣는다", () => {
    const data = homeMapData({ me: { lat: 37.5, lng: 127 }, mood: "TIRED" });
    expect(data.markers[0].mood).toBe("TIRED");
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

describe("tripMapData", () => {
  it("한 호선만 탔으면 그 호선 색 선 하나로 잇고 지난 역마다 점을 찍는다", () => {
    const data = tripMapData(lineMap, ["a", "b", "c"]);
    expect(data.lines).toHaveLength(1);
    expect(data.lines[0].color).toBe("#BDB092");
    expect(data.lines[0].points).toEqual([
      [37.01, 127.01],
      [37.02, 127.02],
      [37.03, 127.03],
    ]);
    expect(data.markers).toHaveLength(3);
    expect(data.fit).toBe(true);
  });

  it("호선이 바뀌면 구간별 선으로 나누고 환승은 점선으로 잇는다", () => {
    const data = tripMapData(lineMap, ["a", "b", "h", "g"]);
    expect(data.lines.map((line) => [line.color, line.dashed ?? false])).toEqual([
      ["#BDB092", false],
      ["#B0B8C1", true],
      ["#EF7C1C", false],
    ]);
    expect(data.lines[1].points).toEqual([
      [37.02, 127.02],
      [37.01, 127.01],
    ]);
  });

  it("지도에 없는 역은 건너뛰고, 점이 하나뿐인 구간은 선으로 그리지 않는다", () => {
    expect(tripMapData(lineMap, ["a", "zzz", "b"]).lines[0].points).toHaveLength(2);
    expect(tripMapData(lineMap, ["a"]).lines).toEqual([]);
    expect(tripMapData(lineMap, []).markers).toEqual([]);
  });
});

describe("visitedMapData 이동 선택", () => {
  it("이동을 고르면 그 이동만 진하게, 호선 선은 흐리게 깔고 지도 맞춤에서는 뺀다", () => {
    const data = visitedMapData(lineMap, undefined, ["d", "e", "f"]);
    const background = data.lines.filter((line) => line.noFit);
    expect(background.length).toBeGreaterThan(0);
    expect(background.every((line) => line.opacity === 0.25)).toBe(true);
    const trip = data.lines.filter((line) => !line.noFit);
    expect(trip).toHaveLength(1);
    expect(trip[0].opacity).toBeUndefined();
    expect(data.markers).toHaveLength(3);
    expect(data.fit).toBe(true);
  });

  it("이동을 고르지 않았거나 역이 하나 이하이면 평소와 같다", () => {
    expect(visitedMapData(lineMap, undefined, undefined)).toEqual(visitedMapData(lineMap));
    expect(visitedMapData(lineMap, undefined, ["a"])).toEqual(visitedMapData(lineMap));
  });

  it("고른 이동의 역이 지도에 하나도 없으면 평소 지도를 보여 준다", () => {
    expect(visitedMapData(lineMap, undefined, ["zzz", "yyy"])).toEqual(visitedMapData(lineMap));
  });
});

describe("지도 HTML의 지도 맞춤", () => {
  it("noFit인 선은 맞춤 범위 계산에서 뺀다", () => {
    expect(buildMapHtml("key")).toContain("if (!line.noFit)");
  });
});

describe("visitedMapData 서버 링크", () => {
  // 번호가 본선과 지선을 섞어 매겨져(a 1, b 2, x 3 지선, c 4) 본선 a-b-c는 번호가 이웃하지 않는다
  const branchLineMap = {
    userId: "u",
    period: "ALL",
    lines: [
      {
        lineId: "02",
        lineName: "2호선",
        colorHex: "#00A84D",
        stations: [station("a", 1, true), station("b", 2, true), station("x", 3, false), station("c", 4, true)],
        links: [
          { fromStationId: "a", toStationId: "b" },
          { fromStationId: "b", toStationId: "c" },
        ],
      },
    ],
  } as unknown as LineMapResponseDto;

  it("번호가 건너뛰어도 서버가 준 링크대로 이어 그린다", () => {
    const data = visitedMapData(branchLineMap);
    expect(data.lines.map((line) => line.points)).toEqual([
      [
        [37.01, 127.01],
        [37.02, 127.02],
      ],
      [
        [37.02, 127.02],
        [37.04, 127.04],
      ],
    ]);
    expect(data.markers).toHaveLength(3);
  });

  it("호선을 고르면 링크로 그린 다른 호선도 흐리게 그린다", () => {
    const two = { ...branchLineMap, lines: [...branchLineMap.lines, { ...branchLineMap.lines[0], lineId: "09", colorHex: "#BDB092" }] } as unknown as LineMapResponseDto;
    const data = visitedMapData(two, "02");
    expect(data.lines.filter((line) => line.color === "#00A84D").every((line) => line.opacity === 1)).toBe(true);
    expect(data.lines.filter((line) => line.color === "#BDB092").every((line) => line.opacity === 0.25)).toBe(true);
  });

  it("링크가 비어 있으면 선은 없고 방문한 역의 점만 찍는다", () => {
    const empty = { ...branchLineMap, lines: [{ ...branchLineMap.lines[0], links: [] }] } as unknown as LineMapResponseDto;
    const data = visitedMapData(empty);
    expect(data.lines).toEqual([]);
    expect(data.markers).toHaveLength(3);
  });

  it("지도에 없는 역을 가리키는 링크는 건너뛴다", () => {
    const stale = {
      ...branchLineMap,
      lines: [{ ...branchLineMap.lines[0], links: [{ fromStationId: "a", toStationId: "zzz" }] }],
    } as unknown as LineMapResponseDto;
    expect(visitedMapData(stale).lines).toEqual([]);
  });
});

describe("지도 HTML의 위쪽 여백", () => {
  it("맞춤 범위에 위쪽 오버레이 높이를 더해 비운다", () => {
    expect(buildMapHtml("key")).toContain("32 + (data.topInset || 0)");
  });
});

