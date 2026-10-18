import * as client from "@/apis/client";
import { getTrainPositions } from "./getTrainPositions";

jest.mock("@/apis/client", () => {
  const actual = jest.requireActual("@/apis/client");
  return { ...actual, get: jest.fn() };
});

describe("trains api", () => {
  beforeEach(() => jest.clearAllMocks());

  it("호선 ID를 쿼리로 보내 열차 위치를 받는다", async () => {
    const body = { lineId: "02", source: "REALTIME", status: "OK", observedAt: null, ageSec: 5, pollIntervalSec: 240, trains: [] };
    (client.get as jest.Mock).mockResolvedValue(body);

    const result = await getTrainPositions("02");

    expect(client.get).toHaveBeenCalledWith("/trains/positions", { lineId: "02" }, undefined);
    expect(result).toBe(body);
  });
});
