import type { FavoritePlace } from "@/apis/queries/users/favoritePlaces";
import { CURRENT_LOCATION_NAME } from "./endpoint";
import { findFavoritePlace, MAX_PLACE_CHIPS, toPlaceBody, toPlaceChips } from "./favoritePlaces";

const station = (id: string, name: string): FavoritePlace => ({
  id,
  name,
  stationId: name,
  lat: null,
  lng: null,
  createdAt: "2026-11-26T09:00:00.000+09:00",
});

const spot = (id: string, name: string, lat: number, lng: number): FavoritePlace => ({
  id,
  name,
  stationId: null,
  lat,
  lng,
  createdAt: "2026-11-26T09:00:00.000+09:00",
});

describe("findFavoritePlace", () => {
  const places = [station("p1", "09_907"), spot("p2", "서울시청", 37.5665, 126.978)];

  it("역은 역 ID로 찾고 이름은 보지 않는다", () => {
    expect(findFavoritePlace(places, { name: "가양역", stationId: "09_907" })?.id).toBe("p1");
  });

  it("장소는 소수 넷째 자리 좌표로 같은 곳을 찾는다", () => {
    expect(findFavoritePlace(places, { name: "시청", lat: 37.56650003, lng: 126.97800001 })?.id).toBe("p2");
    expect(findFavoritePlace(places, { name: "옆 건물", lat: 37.5666, lng: 126.978 })).toBeUndefined();
  });

  it("목록이나 장소가 없으면 찾지 않는다", () => {
    expect(findFavoritePlace(undefined, { name: "가양역", stationId: "09_907" })).toBeUndefined();
    expect(findFavoritePlace(places, undefined)).toBeUndefined();
  });
});

describe("toPlaceBody", () => {
  it("역은 역 ID로, 장소는 좌표로 보낸다", () => {
    expect(toPlaceBody({ name: "가양역", stationId: "09_907" })).toEqual({ name: "가양역", stationId: "09_907" });
    expect(toPlaceBody({ name: "서울시청", lat: 37.5665, lng: 126.978 })).toEqual({
      name: "서울시청",
      lat: 37.5665,
      lng: 126.978,
    });
  });

  it("현재 위치나 위치를 모르는 곳은 저장하지 않는다", () => {
    expect(toPlaceBody({ name: CURRENT_LOCATION_NAME, lat: 37.5, lng: 127 })).toBeNull();
    expect(toPlaceBody({ name: "어딘가" })).toBeNull();
  });
});

describe("toPlaceChips", () => {
  it("최근 저장 순서대로 정해진 개수만 칩으로 만든다", () => {
    const places = ["a", "b", "c", "d"].map((name, index) => station(`p${index}`, name));
    const chips = toPlaceChips(places);

    expect(chips).toHaveLength(MAX_PLACE_CHIPS);
    expect(chips.map((chip) => chip.label)).toEqual(["a", "b", "c"]);
    expect(chips[0]).toMatchObject({ id: "place:p0", endpoint: { name: "a", stationId: "a" } });
  });

  it("저장한 곳이 없으면 빈 목록이다", () => {
    expect(toPlaceChips(undefined)).toEqual([]);
  });
});
