import * as client from "@/apis/client";
import { getNextTrains } from "./getNextTrains";
import { getStationFacilities } from "./getStationFacilities";
import { getStations, MAX_STATION_LOOKUP_IDS } from "./getStations";

jest.mock("@/apis/client", () => {
  const actual = jest.requireActual("@/apis/client");
  return { ...actual, get: jest.fn() };
});

describe("stations api", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("getStations", () => {
    it("sends the ids comma separated without duplicates, keeping the order", async () => {
      (client.get as jest.Mock).mockResolvedValue({ items: [] });

      await getStations(["09_925", "02_222", "09_925"]);

      expect(client.get).toHaveBeenCalledWith(
        "/stations",
        { ids: "09_925,02_222" },
        undefined
      );
    });

    it("sends at most the number of ids the server accepts", async () => {
      (client.get as jest.Mock).mockResolvedValue({ items: [] });
      const ids = Array.from({ length: 30 }, (_, i) => `02_${i}`);

      await getStations(ids);

      const sent = (client.get as jest.Mock).mock.calls[0][1].ids.split(",");
      expect(sent).toHaveLength(MAX_STATION_LOOKUP_IDS);
      expect(sent[0]).toBe("02_0");
    });
  });

  describe("getNextTrains", () => {
    it("calls the station next-trains endpoint and leaves limit out when it is not given", async () => {
      (client.get as jest.Mock).mockResolvedValue({ trains: [] });

      await getNextTrains({ stationId: "09_925" });

      expect(client.get).toHaveBeenCalledWith(
        "/stations/09_925/next-trains",
        undefined,
        undefined
      );
    });

    it("sends the per-direction limit and encodes the station id", async () => {
      (client.get as jest.Mock).mockResolvedValue({ trains: [] });

      await getNextTrains({ stationId: "02_211-3", limit: 3 });
      await getNextTrains({ stationId: "a/b" });

      expect((client.get as jest.Mock).mock.calls[0]).toEqual([
        "/stations/02_211-3/next-trains",
        { limit: 3 },
        undefined,
      ]);
      expect((client.get as jest.Mock).mock.calls[1][0]).toBe("/stations/a%2Fb/next-trains");
    });
  });

  describe("getStationFacilities", () => {
    it("calls the station facilities endpoint", async () => {
      const facilities = { available: false, exits: [] };
      (client.get as jest.Mock).mockResolvedValue(facilities);

      const result = await getStationFacilities("02_222");

      expect(result).toBe(facilities);
      expect(client.get).toHaveBeenCalledWith(
        "/stations/02_222/facilities",
        undefined,
        undefined
      );
    });
  });
});
