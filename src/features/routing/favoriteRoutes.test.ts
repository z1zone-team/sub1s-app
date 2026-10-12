import type { FavoriteRoute } from "@/apis/queries/users/favoriteRoutes";
import type { RecentRouteItem } from "@/common/storage/useRecentRoutes";
import {
  canFavorite,
  favoriteEndpoint,
  favoriteKey,
  findFavorite,
  toHomeRouteChips,
  toSaveBody,
} from "./favoriteRoutes";

const station = (name: string, stationId: string) => ({ name, stationId });

const favorite = (id: string, origin: string, destination: string): FavoriteRoute => ({
  id,
  origin: { name: origin, stationId: origin, lat: null, lng: null },
  destination: { name: destination, stationId: destination, lat: null, lng: null },
  createdAt: "2026-10-12T09:00:00.000+09:00",
});

const recent = (id: string, origin: string, destination: string, searchedAt: string): RecentRouteItem => ({
  id,
  origin,
  originStationId: origin,
  destination,
  destStationId: destination,
  searchedAt,
});

describe("favoriteKey", () => {
  it("역은 역 ID로 같은 경로를 판단하고 이름은 보지 않는다", () => {
    expect(favoriteKey({ stationId: "A" }, { stationId: "B" })).toBe("S:A>S:B");
  });

  it("장소는 소수 4자리로 반올림해 아주 작은 차이는 같은 곳으로 본다", () => {
    expect(favoriteKey({ lat: 37.56650001, lng: 126.97800004 }, { stationId: "B" })).toBe("P:37.5665,126.9780>S:B");
  });

  it("역과 좌표를 함께 주면 역이 우선한다", () => {
    expect(favoriteKey({ stationId: "A", lat: 37.5, lng: 127 }, { stationId: "B" })).toBe("S:A>S:B");
  });

  it("방향이 있다", () => {
    expect(favoriteKey({ stationId: "A" }, { stationId: "B" })).not.toBe(favoriteKey({ stationId: "B" }, { stationId: "A" }));
  });

  it("역도 좌표도 없으면 null", () => {
    expect(favoriteKey({}, { stationId: "B" })).toBeNull();
  });
});

describe("canFavorite와 toSaveBody", () => {
  it("현재 위치가 들어간 경로는 저장할 수 없다", () => {
    const here = { name: "현재 위치", lat: 37.5, lng: 127 };

    expect(canFavorite(here, station("강남", "B"))).toBe(false);
    expect(toSaveBody(station("강남", "B"), here)).toBeNull();
  });

  it("출발과 도착이 같으면 저장할 수 없다", () => {
    expect(canFavorite(station("강남", "A"), station("강남역", "A"))).toBe(false);
  });

  it("역은 역 ID만, 장소는 좌표를 보낸다", () => {
    expect(toSaveBody(station("가양", "A"), { name: "우리집", lat: 37.5, lng: 127 })).toEqual({
      origin: { name: "가양", stationId: "A" },
      destination: { name: "우리집", lat: 37.5, lng: 127 },
    });
  });
});

describe("findFavorite", () => {
  const favorites = [favorite("f1", "A", "B")];

  it("이름이 달라도 같은 역 쌍이면 찾는다", () => {
    expect(findFavorite(favorites, station("에이역", "A"), station("비역", "B"))?.id).toBe("f1");
  });

  it("반대 방향이나 다른 경로는 찾지 못한다", () => {
    expect(findFavorite(favorites, station("B", "B"), station("A", "A"))).toBeUndefined();
    expect(findFavorite(favorites, station("A", "A"), station("C", "C"))).toBeUndefined();
  });

  it("목록이 없으면 undefined", () => {
    expect(findFavorite(undefined, station("A", "A"), station("B", "B"))).toBeUndefined();
  });
});

describe("favoriteEndpoint", () => {
  it("서버의 null을 빼고 앱 끝점으로 바꾼다", () => {
    expect(favoriteEndpoint({ name: "가양", stationId: "A", lat: null, lng: null })).toEqual({ name: "가양", stationId: "A" });
    expect(favoriteEndpoint({ name: "집", stationId: null, lat: 37.5, lng: 127 })).toEqual({ name: "집", lat: 37.5, lng: 127 });
  });
});

describe("toHomeRouteChips", () => {
  const recents = [
    recent("r1", "A", "B", "2026-10-12T08:00:00Z"),
    recent("r2", "C", "D", "2026-10-11T08:00:00Z"),
    recent("r3", "E", "F", "2026-10-10T08:00:00Z"),
  ];

  it("즐겨찾기가 없으면 최근 경로만 칩이 되고 즐겨찾기 표시는 없다", () => {
    const chips = toHomeRouteChips([], recents, 2);

    expect(chips.map((chip) => chip.label)).toEqual(["A → B", "C → D"]);
    expect(chips.every((chip) => !chip.favorite)).toBe(true);
  });

  it("즐겨찾기가 먼저 오고 모자란 만큼 최근 경로로 채운다", () => {
    const chips = toHomeRouteChips([favorite("f1", "X", "Y")], recents, 2);

    expect(chips.map((chip) => [chip.label, chip.favorite])).toEqual([
      ["X → Y", true],
      ["A → B", false],
    ]);
  });

  it("이미 즐겨찾기인 최근 경로는 건너뛴다", () => {
    const chips = toHomeRouteChips([favorite("f1", "A", "B")], recents, 2);

    expect(chips.map((chip) => chip.label)).toEqual(["A → B", "C → D"]);
    expect(chips[0].favorite).toBe(true);
    expect(chips[1].favorite).toBe(false);
  });

  it("즐겨찾기가 한도를 채우면 최근 경로는 나오지 않는다", () => {
    const chips = toHomeRouteChips([favorite("f1", "X", "Y"), favorite("f2", "P", "Q"), favorite("f3", "M", "N")], recents, 2);

    expect(chips.map((chip) => chip.label)).toEqual(["X → Y", "P → Q"]);
  });

  it("같은 경로를 여러 번 검색했어도 칩은 하나", () => {
    const chips = toHomeRouteChips(undefined, [
      recent("r1", "A", "B", "2026-10-12T08:00:00Z"),
      recent("r2", "A", "B", "2026-10-11T08:00:00Z"),
      recent("r3", "C", "D", "2026-10-10T08:00:00Z"),
    ]);

    expect(chips.map((chip) => chip.label)).toEqual(["A → B", "C → D"]);
  });
});
