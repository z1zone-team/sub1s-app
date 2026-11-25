import type { LineMapResponseDto, LineMapStationDto } from "@/apis/queries/profile/getLineMap";
import { buildRecapMap, MAP_HEIGHT, MAP_WIDTH } from "./recapMap";

function station(id: string, lat: number, lng: number, visited = true): LineMapStationDto {
  return { stationId: id, stationName: id, lat, lng, visited, lineSeq: 1 };
}

function map(stations: LineMapStationDto[]): LineMapResponseDto {
  return {
    userId: "user", period: "MONTH", lines: [
      { lineId: "02", lineName: "2호선", colorHex: "#00A84D", stations, links: [
        { fromStationId: "west", toStationId: "east" },
        { fromStationId: "east", toStationId: "unvisited" },
      ] },
    ],
  };
}

it("plots visited coordinates in geographic order and draws only recorded links", () => {
  const [line] = buildRecapMap(map([
    station("west", 37.50, 127.01), station("east", 37.52, 127.04),
    station("unvisited", 36, 125, false), station("invalid", Number.NaN, 127),
  ]));
  const [west, east] = line.points;
  expect(line.points.map(p => p.id)).toEqual(["west", "east"]);
  expect(west.x).toBeLessThan(east.x);
  expect(west.y).toBeGreaterThan(east.y);
  expect(line.path).toBe(`M${west.x} ${west.y}L${east.x} ${east.y}`);
});

it("centers a single visited point and leaves older records without links as points", () => {
  const [line] = buildRecapMap(map([station("west", 37.5, 127)]));
  expect(line.points).toEqual([{ id: "west", x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 }]);
  expect(line.path).toBe("");
});
