import type { LineTrainPositions, TrainPosition } from "@/apis/queries/trains/getTrainPositions";
import type { Stop } from "./progress";
import { isFreshPositions, MAX_POSITION_AGE_SEC, positionAgeLabel, trainMarkers } from "./trainMarkers";

const stop = (stationId: string): Stop => ({ stationId, atSec: 0 });
// 2호선 A B C D를 이 순서로 지나는 경로. 좌표는 경도가 0.01씩 늘어난다
const stops = [stop("02_A"), stop("02_B"), stop("02_C"), stop("02_D")];
const stations = new Map([
  ["02_A", { lat: 37.5, lng: 127.0 }],
  ["02_B", { lat: 37.5, lng: 127.1 }],
  ["02_C", { lat: 37.5, lng: 127.2 }],
  ["02_D", { lat: 37.5, lng: 127.3 }],
  ["09_X", { lat: 37.6, lng: 127.0 }],
]);
const options = { lineId: "02", direction: "OUTER" as const, stops, stations, color: "#00A84D" };

const train = (overrides: Partial<TrainPosition>): TrainPosition => ({
  trainNo: "1",
  stationName: "B",
  stationId: "02_B",
  status: "ARRIVED",
  direction: "OUTER",
  destinationName: "성수",
  isExpress: false,
  isLastTrain: false,
  ...overrides,
});

describe("trainMarkers", () => {
  it("진입과 도착은 그 역 위에 그린다", () => {
    const markers = trainMarkers([train({ status: "ENTERING" }), train({ trainNo: "2", status: "ARRIVED" })], options);

    expect(markers.map((m) => [m.lat, m.lng])).toEqual([
      [37.5, 127.1],
      [37.5, 127.1],
    ]);
    expect(markers[0]).toMatchObject({ color: "#00A84D", radius: 8 });
  });

  it("출발은 이 역에서 다음 역 쪽으로 조금 간 곳에 그린다", () => {
    const [marker] = trainMarkers([train({ status: "DEPARTED" })], options);

    expect(marker.lat).toBe(37.5);
    expect(marker.lng).toBeCloseTo(127.125);
  });

  it("전역출발은 앞 역에서 이 역 쪽으로 많이 간 곳에 그린다", () => {
    const [marker] = trainMarkers([train({ status: "LEFT_PREVIOUS" })], options);

    expect(marker.lng).toBeCloseTo(127.07);
  });

  it("앞이나 뒤 역이 경로에 없으면 역 위에 그린다", () => {
    const first = trainMarkers([train({ stationName: "A", stationId: "02_A", status: "LEFT_PREVIOUS" })], options);
    const last = trainMarkers([train({ stationName: "D", stationId: "02_D", status: "DEPARTED" })], options);

    expect(first[0].lng).toBe(127.0);
    expect(last[0].lng).toBe(127.3);
  });

  it("가는 방향이 다른 열차는 그리지 않는다", () => {
    expect(trainMarkers([train({ direction: "INNER" })], options)).toEqual([]);
  });

  it("안내 경로가 지나지 않는 역과 다른 호선, 역 ID를 모르는 열차는 그리지 않는다", () => {
    const markers = trainMarkers(
      [
        train({ stationName: "Z", stationId: "02_Z" }),
        train({ stationName: "X", stationId: "09_X" }),
        train({ stationName: "?", stationId: null }),
      ],
      options
    );

    expect(markers).toEqual([]);
  });

  it("상태를 모르는 열차는 그리지 않는다", () => {
    expect(trainMarkers([train({ status: "UNKNOWN" })], options)).toEqual([]);
  });

  it("좌표를 모르는 역의 열차는 그리지 않는다", () => {
    const withoutB = new Map(stations);
    withoutB.delete("02_B");

    expect(trainMarkers([train({})], { ...options, stations: withoutB })).toEqual([]);
  });

  it("다른 호선으로 갈아타는 경로에서는 지금 타는 호선의 역만 본다", () => {
    const mixed = [stop("02_A"), stop("02_B"), stop("09_X")];

    expect(trainMarkers([train({})], { ...options, stops: mixed })).toHaveLength(1);
    expect(trainMarkers([train({ stationName: "X", stationId: "09_X" })], { ...options, stops: mixed })).toEqual([]);
  });
});

describe("isFreshPositions", () => {
  const positions = (overrides: Partial<LineTrainPositions>): LineTrainPositions => ({
    lineId: "02",
    source: "REALTIME",
    status: "OK",
    observedAt: "2026-10-18T12:00:00.000+09:00",
    ageSec: 30,
    pollIntervalSec: 240,
    trains: [],
    ...overrides,
  });

  it("정상이고 충분히 새로우면 쓴다", () => {
    expect(isFreshPositions(positions({}))).toBe(true);
    expect(isFreshPositions(positions({ ageSec: MAX_POSITION_AGE_SEC }))).toBe(true);
  });

  it("오래됐거나 모으지 못했거나 아직 없으면 쓰지 않는다", () => {
    expect(isFreshPositions(positions({ ageSec: MAX_POSITION_AGE_SEC + 1 }))).toBe(false);
    expect(isFreshPositions(positions({ status: "NOT_COLLECTED", ageSec: null }))).toBe(false);
    expect(isFreshPositions(positions({ status: "UNSUPPORTED_LINE", ageSec: null }))).toBe(false);
    expect(isFreshPositions(undefined)).toBe(false);
  });
});

describe("positionAgeLabel", () => {
  it("1분 안이면 방금 전, 아니면 분 단위로 보여 준다", () => {
    expect(positionAgeLabel(0)).toBe("방금 전");
    expect(positionAgeLabel(59)).toBe("방금 전");
    expect(positionAgeLabel(95)).toBe("2분 전");
    expect(positionAgeLabel(240)).toBe("4분 전");
  });
});
