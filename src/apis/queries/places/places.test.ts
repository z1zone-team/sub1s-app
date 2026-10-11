import * as client from "@/apis/client";
import {
  MAX_PLACE_QUERY_LENGTH,
  normalizePlaceQuery,
  searchPlaces,
} from "./searchPlaces";

jest.mock("@/apis/client", () => {
  const actual = jest.requireActual("@/apis/client");
  return { ...actual, get: jest.fn() };
});

describe("places api", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("normalizePlaceQuery", () => {
    it("trims and collapses whitespace", () => {
      expect(normalizePlaceQuery("  강남   역  ")).toBe("강남 역");
      expect(normalizePlaceQuery("\t교보\n타워 ")).toBe("교보 타워");
    });

    it("cuts the query to the server limit", () => {
      const long = "가".repeat(80);

      expect(normalizePlaceQuery(long)).toHaveLength(MAX_PLACE_QUERY_LENGTH);
    });

    it("turns blank input into an empty string", () => {
      expect(normalizePlaceQuery("   ")).toBe("");
      expect(normalizePlaceQuery("")).toBe("");
    });
  });

  describe("searchPlaces", () => {
    it("calls GET /places/search with the normalized query and the optional location", async () => {
      const result = { items: [] };
      (client.get as jest.Mock).mockResolvedValue(result);
      const controller = new AbortController();

      const response = await searchPlaces(
        { q: "  강남역 ", lat: 37.5, lng: 127.03, limit: 5 },
        { signal: controller.signal }
      );

      expect(response).toBe(result);
      expect(client.get).toHaveBeenCalledWith(
        "/places/search",
        { q: "강남역", lat: 37.5, lng: 127.03, limit: 5 },
        { signal: controller.signal }
      );
    });

    it("passes server errors through, such as the rate limit", async () => {
      const limited = new client.ApiError("TOO_MANY_REQUESTS", "slow down", 429);
      (client.get as jest.Mock).mockRejectedValue(limited);

      await expect(searchPlaces({ q: "강남" })).rejects.toBe(limited);
    });
  });
});
