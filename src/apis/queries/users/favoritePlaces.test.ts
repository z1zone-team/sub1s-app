import * as client from "@/apis/client";
import { getFavoritePlaces, removeFavoritePlace, saveFavoritePlace } from "./favoritePlaces";

jest.mock("@/apis/client", () => {
  const actual = jest.requireActual("@/apis/client");
  return { ...actual, get: jest.fn(), put: jest.fn(), del: jest.fn() };
});

describe("favoritePlaces API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("부르는 경로가 서버 계약과 같다", async () => {
    (client.get as jest.Mock).mockResolvedValue({ places: [], limit: 20 });
    (client.put as jest.Mock).mockResolvedValue({});
    (client.del as jest.Mock).mockResolvedValue({ id: "p1", removed: true });

    await getFavoritePlaces();
    await saveFavoritePlace({ name: "가양역", stationId: "09_907" });
    await removeFavoritePlace("p1");

    expect(client.get).toHaveBeenCalledWith("/users/me/favorites/places", undefined, undefined);
    expect(client.put).toHaveBeenCalledWith("/users/me/favorites/places", { name: "가양역", stationId: "09_907" });
    expect(client.del).toHaveBeenCalledWith("/users/me/favorites/places/p1");
  });
});
