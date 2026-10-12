import type {
  PlaceSearchItem,
  StationSearchItem,
} from "@/apis/queries/places/searchPlaces";
import type { RecentRouteItem } from "@/common/storage/useRecentRoutes";
import {
  CURRENT_LOCATION_NAME,
  endpointFromCoords,
  endpointFromPlace,
  endpointFromStation,
  endpointKey,
  isSameEndpoint,
  isValidEndpoint,
  parseEndpointParam,
  stringifyEndpointParam,
  toRouteSearchRequest,
} from "./endpoint";
import { staleStationIds, toRecentDestinations, toRecentRouteChips } from "./recentDestinations";
import { toSearchRows } from "./searchRows";

const line = (lineId: string) => ({ lineId, lineName: `${lineId}호선`, colorHex: "#000000" });

const station = (stationId: string, name: string, lineId: string): StationSearchItem => ({
  type: "STATION",
  stationId,
  name,
  lat: 37.5,
  lng: 127.0,
  line: line(lineId),
  lines: [line(lineId)],
});

const place = (over: Partial<PlaceSearchItem> = {}): PlaceSearchItem => ({
  type: "PLACE",
  name: "강남 교보타워",
  address: "서울 서초구 강남대로 465",
  lat: 37.5035,
  lng: 127.0243,
  nearestStation: { stationId: "02_222", name: "강남", walkDistanceM: 350, walkDurationSec: 290 },
  ...over,
});

describe("endpoint", () => {
  describe("endpointFrom*", () => {
    it("keeps only the station id for a station", () => {
      expect(endpointFromStation(station("02_222", "강남", "02"))).toEqual({
        name: "강남",
        stationId: "02_222",
      });
    });

    it("keeps the name and coordinates for a place, which the server turns into walking legs", () => {
      expect(endpointFromPlace(place())).toEqual({
        name: "강남 교보타워",
        lat: 37.5035,
        lng: 127.0243,
      });
    });

    it("names the device position as the current location", () => {
      expect(endpointFromCoords(37.56, 126.97)).toEqual({
        name: CURRENT_LOCATION_NAME,
        lat: 37.56,
        lng: 126.97,
      });
    });
  });

  describe("isValidEndpoint", () => {
    it("accepts a station id or a pair of coordinates", () => {
      expect(isValidEndpoint({ name: "강남", stationId: "02_222" })).toBe(true);
      expect(isValidEndpoint({ name: "여기", lat: 37.5, lng: 127 })).toBe(true);
    });

    it("rejects a missing endpoint, a name only, and a half coordinate", () => {
      expect(isValidEndpoint(undefined)).toBe(false);
      expect(isValidEndpoint({ name: "강남" })).toBe(false);
      expect(isValidEndpoint({ name: "여기", lat: 37.5 })).toBe(false);
      expect(isValidEndpoint({ name: "여기", lat: Number.NaN, lng: 127 })).toBe(false);
    });

    it("treats a zero coordinate as a real value", () => {
      expect(isValidEndpoint({ name: "적도", lat: 0, lng: 0 })).toBe(true);
    });
  });

  describe("isSameEndpoint", () => {
    it("compares stations by id and places by coordinates", () => {
      expect(isSameEndpoint({ name: "a", stationId: "02_222" }, { name: "b", stationId: "02_222" })).toBe(true);
      expect(isSameEndpoint({ name: "a", stationId: "02_222" }, { name: "b", stationId: "02_221" })).toBe(false);
      expect(isSameEndpoint({ name: "a", lat: 37.5, lng: 127 }, { name: "b", lat: 37.5, lng: 127 })).toBe(true);
      expect(isSameEndpoint({ name: "a", lat: 37.5, lng: 127 }, { name: "b", lat: 37.6, lng: 127 })).toBe(false);
    });

    it("does not guess when one side is a station and the other a place", () => {
      expect(isSameEndpoint({ name: "a", stationId: "02_222" }, { name: "b", lat: 37.5, lng: 127 })).toBe(false);
    });
  });

  describe("endpointKey", () => {
    it("is stable for the same destination and different for different ones", () => {
      expect(endpointKey({ name: "x", stationId: "02_222" })).toBe("station:02_222");
      expect(endpointKey({ name: "x", lat: 37.50351, lng: 127.02431 })).toBe(
        endpointKey({ name: "y", lat: 37.503510001, lng: 127.024310001 })
      );
      expect(endpointKey({ name: "x", lat: 37.5, lng: 127 })).not.toBe(
        endpointKey({ name: "x", lat: 37.6, lng: 127 })
      );
    });

    it("falls back to the name when there is nothing else", () => {
      expect(endpointKey({ name: "집" })).toBe("name:집");
    });
  });

  describe("toRouteSearchRequest", () => {
    it("sends station ids for stations", () => {
      expect(
        toRouteSearchRequest({ name: "가양", stationId: "09_907" }, { name: "강남", stationId: "02_222" })
      ).toEqual({ originStationId: "09_907", destinationStationId: "02_222" });
    });

    it("sends coordinates and names for places and the current location", () => {
      expect(
        toRouteSearchRequest(endpointFromCoords(37.56, 126.97), endpointFromPlace(place()))
      ).toEqual({
        originLat: 37.56,
        originLng: 126.97,
        originName: "현재 위치",
        destinationLat: 37.5035,
        destinationLng: 127.0243,
        destinationName: "강남 교보타워",
      });
    });

    it("mixes the two kinds and adds the preferred mode only when given", () => {
      const request = toRouteSearchRequest(
        { name: "가양", stationId: "09_907" },
        endpointFromPlace(place()),
        "PERSONAL"
      );

      expect(request).toMatchObject({
        originStationId: "09_907",
        destinationLat: 37.5035,
        routeMode: "PERSONAL",
      });
      expect(request).not.toHaveProperty("originLat");
      expect(request).not.toHaveProperty("destinationStationId");
      expect(
        toRouteSearchRequest({ name: "a", stationId: "1" }, { name: "b", stationId: "2" })
      ).not.toHaveProperty("routeMode");
    });
  });

  describe("deep link param", () => {
    it("reads a station id and ignores an empty value", () => {
      expect(parseEndpointParam(" 09_925 ")).toEqual({ name: "", stationId: "09_925" });
      expect(parseEndpointParam("")).toBeUndefined();
      expect(parseEndpointParam(undefined)).toBeUndefined();
    });

    it("writes the station id back and writes nothing for a place", () => {
      expect(stringifyEndpointParam({ name: "강남", stationId: "02_222" })).toBe("02_222");
      expect(stringifyEndpointParam({ name: "여기", lat: 1, lng: 2 })).toBe("");
    });
  });
});

describe("toSearchRows", () => {
  it("turns a station into a row with its own line badge and a station endpoint", () => {
    const [row] = toSearchRows([station("02_222", "강남", "02")]);

    expect(row).toEqual({
      key: "02_222",
      kind: "STATION",
      title: "강남",
      lineIds: ["02"],
      endpoint: { name: "강남", stationId: "02_222" },
    });
  });

  it("turns a place into a row with the address, a walking hint and a coordinate endpoint", () => {
    const [row] = toSearchRows([place()]);

    expect(row).toMatchObject({
      kind: "PLACE",
      title: "강남 교보타워",
      subtitle: "서울 서초구 강남대로 465",
      hint: "강남역에서 도보 5분",
      lineIds: [],
      endpoint: { name: "강남 교보타워", lat: 37.5035, lng: 127.0243 },
    });
  });

  it("keeps the server order and gives different keys to the same station on several lines", () => {
    const rows = toSearchRows([
      station("01_133", "서울역", "01"),
      station("04_426", "서울역", "04"),
      place(),
    ]);

    expect(rows.map((row) => row.kind)).toEqual(["STATION", "STATION", "PLACE"]);
    expect(new Set(rows.map((row) => row.key)).size).toBe(3);
  });

  it("leaves the subtitle out when a place has no address", () => {
    expect(toSearchRows([place({ address: "" })])[0].subtitle).toBeUndefined();
  });

  it("returns nothing for no results", () => {
    expect(toSearchRows([])).toEqual([]);
  });
});

describe("recent destinations", () => {
  const route = (over: Partial<RecentRouteItem>): RecentRouteItem => ({
    id: "r",
    origin: "가양",
    destination: "강남",
    searchedAt: "2026-10-06T10:00:00.000Z",
    ...over,
  });

  it("lists destinations newest first and keeps one entry per destination", () => {
    const list = toRecentDestinations([
      route({ id: "1", destination: "강남", destStationId: "02_222", searchedAt: "2026-10-01T00:00:00.000Z" }),
      route({ id: "2", destination: "신논현", destStationId: "09_925", searchedAt: "2026-10-03T00:00:00.000Z" }),
      route({ id: "3", destination: "강남", destStationId: "02_222", searchedAt: "2026-10-05T00:00:00.000Z" }),
    ]);

    expect(list.map((item) => item.endpoint.stationId)).toEqual(["02_222", "09_925"]);
    expect(list[0].searchedAt).toBe("2026-10-05T00:00:00.000Z");
    expect(list[0].routeIds).toEqual(["3", "1"]);
    expect(list[1].routeIds).toEqual(["2"]);
  });

  it("keeps the coordinates of a place destination and merges it by position, not by name", () => {
    const list = toRecentDestinations([
      route({ destination: "교보타워", destLat: 37.5035, destLng: 127.0243, searchedAt: "2026-10-01T00:00:00.000Z" }),
      route({ destination: "교보타워 본관", destLat: 37.5035, destLng: 127.0243, searchedAt: "2026-10-02T00:00:00.000Z" }),
      route({ destination: "교보타워", destLat: 37.6, destLng: 127.0, searchedAt: "2026-10-03T00:00:00.000Z" }),
    ]);

    expect(list).toHaveLength(2);
    expect(list[0].endpoint).toMatchObject({ lat: 37.6, lng: 127.0 });
    expect(list[1].endpoint.name).toBe("교보타워 본관");
  });

  it("stops at the limit", () => {
    const routes = Array.from({ length: 15 }, (_, i) =>
      route({ destination: `역${i}`, destStationId: `02_${i}`, searchedAt: `2026-10-${String(i + 1).padStart(2, "0")}T00:00:00.000Z` })
    );

    expect(toRecentDestinations(routes)).toHaveLength(10);
    expect(toRecentDestinations(routes, 3)).toHaveLength(3);
  });

  it("returns nothing for no history", () => {
    expect(toRecentDestinations([])).toEqual([]);
  });

  describe("staleStationIds", () => {
    const destinations = toRecentDestinations([
      route({ destination: "강남", destStationId: "02_222", searchedAt: "2026-10-03T00:00:00.000Z" }),
      route({ destination: "옛역", destStationId: "99_999", searchedAt: "2026-10-02T00:00:00.000Z" }),
      route({ destination: "교보타워", destLat: 37.5, destLng: 127, searchedAt: "2026-10-01T00:00:00.000Z" }),
    ]);

    it("lists the station ids the server no longer knows and leaves places alone", () => {
      expect(staleStationIds(destinations, new Set(["02_222"]))).toEqual(["99_999"]);
    });

    it("lists nothing when the server knows every station", () => {
      expect(staleStationIds(destinations, new Set(["02_222", "99_999"]))).toEqual([]);
    });
  });
});

describe("toRecentRouteChips", () => {
  const route = (id: string, origin: string, destination: string, searchedAt: string) => ({
    id,
    origin,
    originStationId: `${origin}-id`,
    destination,
    destLat: 37.5,
    destLng: 127,
    searchedAt,
  });

  it("최신순으로 개수만큼 출발 → 도착 칩을 만든다", () => {
    const chips = toRecentRouteChips(
      [route("a", "가양", "신논현", "2026-10-01T00:00:00Z"), route("b", "가좌", "홍대입구", "2026-10-05T00:00:00Z"), route("c", "강남", "시청", "2026-09-01T00:00:00Z")],
      2
    );
    expect(chips.map((chip) => chip.label)).toEqual(["가좌 → 홍대입구", "가양 → 신논현"]);
    expect(chips[0].origin).toMatchObject({ name: "가좌", stationId: "가좌-id" });
    expect(chips[0].destination).toMatchObject({ name: "홍대입구", lat: 37.5, lng: 127 });
  });
});
