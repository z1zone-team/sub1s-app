import type { UserPlace } from "@/apis/queries/users/places";
import { endpointToSaveBody, placeOfKind, placeToEndpoint } from "./placeEndpoint";

const station: UserPlace = { kind: "HOME", name: "가양역", stationId: "09_907", lat: null, lng: null };
const spot: UserPlace = { kind: "SCHOOL", name: "학교", stationId: null, lat: 37.5, lng: 127.03 };

describe("placeToEndpoint", () => {
  it("역은 역 ID만 가진다", () => {
    expect(placeToEndpoint(station)).toEqual({ name: "가양역", stationId: "09_907" });
  });

  it("장소는 좌표를 가진다", () => {
    expect(placeToEndpoint(spot)).toEqual({ name: "학교", lat: 37.5, lng: 127.03 });
  });
});

describe("endpointToSaveBody", () => {
  it("역이면 역 ID만 보낸다", () => {
    expect(endpointToSaveBody({ name: "가양역", stationId: "09_907", lat: 37.5, lng: 127.0 })).toEqual({
      name: "가양역",
      stationId: "09_907",
    });
  });

  it("장소면 좌표를 보낸다", () => {
    expect(endpointToSaveBody({ name: "학교", lat: 37.5, lng: 127.03 })).toEqual({
      name: "학교",
      lat: 37.5,
      lng: 127.03,
    });
  });

  it("역도 좌표도 없으면 보내지 않는다", () => {
    expect(endpointToSaveBody({ name: "어딘가" })).toBeNull();
  });
});

describe("placeOfKind", () => {
  it("종류로 찾고 없으면 undefined다", () => {
    expect(placeOfKind([station, spot], "SCHOOL")).toBe(spot);
    expect(placeOfKind([station], "SCHOOL")).toBeUndefined();
    expect(placeOfKind(undefined, "HOME")).toBeUndefined();
  });
});
