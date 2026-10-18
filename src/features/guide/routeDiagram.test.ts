import type { PathSegmentDto, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { getLineInfo } from "@/theme";
import type { Stop } from "./progress";
import {
  buildRouteDiagram,
  diagramLabel,
  DIAGRAM_BEND,
  DIAGRAM_DOT_BAND,
  DIAGRAM_LABEL_STEP,
  DIAGRAM_MAX_LABEL,
  DIAGRAM_MIN_SPACING,
  DIAGRAM_PADDING,
  DIAGRAM_SIDE,
  DIAGRAM_TRANSFER_BAND,
  DIAGRAM_WALK_COLOR,
  linkPath,
} from "./routeDiagram";

const segment = (over: Partial<PathSegmentDto>): PathSegmentDto => ({
  lineId: "02",
  direction: "UP",
  isExpress: false,
  fromStationId: "a",
  fromStationName: "",
  toStationId: "b",
  toStationName: "",
  stationCount: 3,
  durationSec: 600,
  distanceKm: 3,
  recommendedCarNo: 3,
  isWeakAirConditioned: false,
  congestionLevel: "보통",
  congestionRate: 50,
  operationStatus: "NORMAL",
  ...over,
});

const option = (segments: PathSegmentDto[]): SubwayRouteOptionDto => ({
  mode: "OPTIMAL",
  totalDurationSec: 1800,
  totalDistanceKm: 10,
  totalFare: 1650,
  transferCount: segments.length - 1,
  estimatedArrivalTimestamp: "2026-10-12T05:51:00.000Z",
  segments,
  highlights: [],
  operationStatus: "NORMAL",
});

const stop = (id: string, segmentIndex?: number): Stop => ({ stationId: id, atSec: 0, segmentIndex });
const WIDTH = 360;
const LEFT = DIAGRAM_SIDE;
const RIGHT = WIDTH - DIAGRAM_SIDE;

describe("buildRouteDiagram", () => {
  describe("열차를 하나만 탈 때", () => {
    const single = option([segment({})]);
    const stops = [stop("s0", 0), stop("s1", 0), stop("s2", 0), stop("s3")];
    const names = ["강남", "역삼", "선릉", "삼성"];
    const model = buildRouteDiagram({ option: single, stops, names, visible: [0, 1, 2, 3], currentPosition: 1, width: WIDTH });

    it("한 줄 직선이다: 모든 역이 같은 높이에 왼쪽에서 오른쪽으로 같은 간격으로 놓인다", () => {
      expect(model.rows).toHaveLength(1);
      expect(model.rows[0].direction).toBe("right");
      expect(new Set(model.nodes.map((node) => node.y)).size).toBe(1);
      const expected = [0, 1, 2, 3].map((k) => Math.round(LEFT + ((RIGHT - LEFT) * k) / 3));
      expect(model.nodes.map((node) => Math.round(node.x))).toEqual(expected);
    });

    it("꺾이는 곳이 없고 선은 호선 색 직선이다", () => {
      expect(model.transfers).toEqual([]);
      expect(model.links).toHaveLength(3);
      expect(model.links.every((link) => !link.turn && !link.dashed)).toBe(true);
      expect(model.links[0].color).toBe(getLineInfo("02").color);
      expect(linkPath(model.links[0])).toBe(`M ${LEFT} ${DIAGRAM_PADDING} L ${model.nodes[1].x} ${DIAGRAM_PADDING}`);
    });

    it("처음과 끝, 지나온 역, 지금 역, 앞으로 갈 역을 가른다", () => {
      expect(model.nodes.map((node) => node.kind)).toEqual(["start", "stop", "stop", "end"]);
      expect(model.nodes.map((node) => node.state)).toEqual(["passed", "current", "upcoming", "upcoming"]);
      expect(model.links.map((link) => link.passed)).toEqual([true, false, false]);
    });

    it("높이는 이름이 가장 긴 만큼이다", () => {
      expect(model.height).toBe(DIAGRAM_PADDING * 2 + DIAGRAM_DOT_BAND + 2 * DIAGRAM_LABEL_STEP + 6);
    });
  });

  describe("환승해서 여러 열차를 탈 때", () => {
    const two = option([segment({ lineId: "02" }), segment({ lineId: "09" })]);
    // 환승역 신도림(s2)은 두 구간이 같은 이름이라 하나만 보인다. 두 번째 구간의 첫 역이다
    const stops = [stop("s0", 0), stop("s1", 0), stop("s2", 1), stop("s3", 1), stop("s4")];
    const names = ["강남", "교대", "신도림", "가양", "마곡"];
    const model = buildRouteDiagram({ option: two, stops, names, visible: [0, 1, 2, 3, 4], currentPosition: 0, width: WIDTH });

    it("구간마다 한 줄이고 줄이 번갈아 반대 방향으로 흐른다", () => {
      expect(model.rows.map((row) => row.direction)).toEqual(["right", "left"]);
      expect(model.nodes.map((node) => node.row)).toEqual([0, 0, 1, 1, 1]);
      // 첫 줄은 오른쪽으로, 둘째 줄은 오른쪽 끝에서 시작해 왼쪽으로
      expect(model.nodes[0].x).toBe(LEFT);
      expect(model.nodes[2].x).toBe(RIGHT);
      expect(model.nodes[2].x).toBeGreaterThan(model.nodes[3].x);
      expect(model.nodes[3].x).toBeGreaterThan(model.nodes[4].x);
      expect(model.nodes[4].x).toBe(LEFT);
    });

    it("둘째 줄은 첫 줄 아래에 있다", () => {
      expect(model.rows[1].y).toBe(model.rows[0].y + DIAGRAM_DOT_BAND + model.rows[0].labelHeight + DIAGRAM_TRANSFER_BAND);
    });

    it("줄이 넘어가는 곳은 바깥으로 불룩한 곡선이고 새 열차의 색이다", () => {
      const turn = model.links.find((link) => link.turn);
      expect(turn?.turn?.side).toBe(1);
      expect(turn?.color).toBe(getLineInfo("09").color);
      expect(linkPath(turn!)).toContain(" C ");
      // 불룩한 쪽의 제어점이 점보다 바깥(오른쪽)에 있다
      expect(linkPath(turn!)).toContain(`${RIGHT + DIAGRAM_BEND * 2} `);
      expect(model.links.filter((link) => !link.turn).map((link) => link.color)).toEqual([
        getLineInfo("02").color,
        getLineInfo("09").color,
        getLineInfo("09").color,
      ]);
    });

    it("꺾이는 곳에 환승 점과 갈아탈 호선 이름을 붙인다", () => {
      expect(model.nodes.map((node) => node.kind)).toEqual(["start", "transfer", "transfer", "stop", "end"]);
      expect(model.transfers).toHaveLength(1);
      expect(model.transfers[0].label).toContain(getLineInfo("09").name);
      expect(model.transfers[0].label).toContain("환승");
      expect(model.transfers[0].x).toBe(RIGHT);
      expect(model.transfers[0].color).toBe(getLineInfo("09").color);
    });
  });

  it("세 번 타면 오른쪽, 왼쪽, 오른쪽으로 흐르며 두 번 꺾인다", () => {
    const three = option([segment({ lineId: "02" }), segment({ lineId: "09" }), segment({ lineId: "01" })]);
    const stops = [stop("a", 0), stop("b", 0), stop("c", 1), stop("d", 1), stop("e", 2), stop("f")];
    const model = buildRouteDiagram({
      option: three,
      stops,
      names: ["a", "b", "c", "d", "e", "f"],
      visible: [0, 1, 2, 3, 4, 5],
      currentPosition: 0,
      width: WIDTH,
    });

    expect(model.rows.map((row) => row.direction)).toEqual(["right", "left", "right"]);
    expect(model.links.filter((link) => link.turn).map((link) => link.turn?.side)).toEqual([1, -1]);
    expect(model.transfers).toHaveLength(2);
    // 셋째 줄은 왼쪽 끝에서 시작한다
    expect(model.nodes[4].x).toBe(LEFT);
  });

  it("도보 구간은 앞 탑승 구간과 같은 줄에서 점선으로 이어진다", () => {
    const walking = option([segment({ lineId: "02" }), segment({ lineId: "WALK", direction: "NONE" })]);
    const stops = [stop("a", 0), stop("b", 0), stop("c", 1), stop("d")];
    const model = buildRouteDiagram({
      option: walking,
      stops,
      names: ["a", "b", "c", "d"],
      visible: [0, 1, 2, 3],
      currentPosition: 0,
      width: WIDTH,
    });

    expect(model.rows).toHaveLength(1);
    expect(model.links.map((link) => link.dashed)).toEqual([false, true, true]);
    expect(model.links[2].color).toBe(DIAGRAM_WALK_COLOR);
  });

  it("보이는 역만 그린다(같은 이름이 이어지는 역은 건너뜀)", () => {
    const route = option([segment({})]);
    const stops = [stop("a", 0), stop("b", 0), stop("c", 0), stop("d")];
    const model = buildRouteDiagram({
      option: route,
      stops,
      names: ["a", "b", "b", "d"],
      visible: [0, 1, 3],
      currentPosition: 1,
      width: WIDTH,
    });

    expect(model.nodes.map((node) => node.index)).toEqual([0, 1, 3]);
    expect(model.nodes.map((node) => node.name)).toEqual(["a", "b", "d"]);
  });

  it("역이 없으면 비어 있다", () => {
    const model = buildRouteDiagram({
      option: option([segment({})]),
      stops: [],
      names: [],
      visible: [],
      currentPosition: 0,
      width: WIDTH,
    });

    expect(model).toEqual({ nodes: [], rows: [], links: [], transfers: [], height: 0 });
  });

  it("한 줄에 역이 하나뿐이어도 그린다", () => {
    const two = option([segment({ lineId: "02" }), segment({ lineId: "09" })]);
    const stops = [stop("a", 0), stop("b", 0), stop("c", 1)];
    const model = buildRouteDiagram({
      option: two,
      stops,
      names: ["a", "b", "c"],
      visible: [0, 1, 2],
      currentPosition: 0,
      width: WIDTH,
    });

    expect(model.rows).toHaveLength(2);
    expect(model.nodes[2].x).toBe(RIGHT);
  });
});

describe("역이 많아 한 줄에 다 못 담을 때", () => {
  const count = 40;
  const single = option([segment({})]);
  const stops = Array.from({ length: count }, (_, k) => stop(`s${k}`, k === count - 1 ? undefined : 0));
  const names = Array.from({ length: count }, (_, k) => `역${k}`);
  const model = buildRouteDiagram({
    option: single,
    stops,
    names,
    visible: Array.from({ length: count }, (_, k) => k),
    currentPosition: 0,
    width: WIDTH,
  });

  it("같은 열차가 다음 줄로 꺾여 이어지고, 어느 줄에서도 역 사이가 최소 간격 이상이다", () => {
    expect(model.rows.length).toBeGreaterThan(1);
    expect(model.rows.map((row) => row.direction).slice(0, 3)).toEqual(["right", "left", "right"]);
    for (const row of model.rows) {
      const xs = model.nodes.filter((node) => node.row === row.index).map((node) => node.x).sort((a, b) => a - b);
      for (let k = 1; k < xs.length; k += 1) expect(xs[k] - xs[k - 1]).toBeGreaterThanOrEqual(DIAGRAM_MIN_SPACING - 0.001);
    }
  });

  it("호선이 바뀐 게 아니므로 환승 표시가 없고 줄 색은 그대로다", () => {
    expect(model.transfers).toEqual([]);
    expect(new Set(model.rows.map((row) => row.color)).size).toBe(1);
    expect(model.nodes.filter((node) => node.kind === "transfer")).toEqual([]);
    expect(model.links.filter((link) => link.turn).length).toBe(model.rows.length - 1);
  });

  it("모든 역을 한 번씩 놓고 줄마다 역 수가 비슷하다", () => {
    expect(model.nodes).toHaveLength(count);
    const perRow = model.rows.map((row) => model.nodes.filter((node) => node.row === row.index).length);
    expect(Math.max(...perRow) - Math.min(...perRow)).toBeLessThanOrEqual(1);
  });
});

describe("diagramLabel", () => {
  it("긴 이름은 줄이고 …를 붙인다", () => {
    expect(diagramLabel("강남")).toBe("강남");
    expect(diagramLabel("가나다라마바")).toBe("가나다라마바");
    const long = "가나다라마바사아";
    expect([...diagramLabel(long)]).toHaveLength(DIAGRAM_MAX_LABEL);
    expect(diagramLabel(long).endsWith("…")).toBe(true);
  });
});
