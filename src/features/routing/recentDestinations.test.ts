import type { RecentRouteItem } from "@/common/storage/useRecentRoutes";
import { toRecentDestinations } from "./recentDestinations";

const route = (id: string, destination: string, searchedAt: string, destStationId?: string): RecentRouteItem =>
  ({
    id,
    origin: "강남",
    destination,
    destStationId,
    searchedAt,
  }) as RecentRouteItem;

describe("toRecentDestinations", () => {
  it("같은 도착지는 가장 최근 하나로 합치고 최신순이다", () => {
    const result = toRecentDestinations([
      route("a", "판교", "2026-10-18T10:00:00Z", "k_1"),
      route("b", "대림", "2026-10-19T10:00:00Z", "d_1"),
      route("c", "판교", "2026-10-17T10:00:00Z", "k_1"),
    ]);

    expect(result.map((item) => item.endpoint.name)).toEqual(["대림", "판교"]);
    expect(result[1].routeIds).toEqual(["a", "c"]);
  });

  it("이름이 비어 있는 기록은 보이지 않는다", () => {
    const result = toRecentDestinations([
      route("a", "", "2026-10-19T10:00:00Z", "x_1"),
      route("b", "   ", "2026-10-19T09:00:00Z", "x_2"),
      route("c", "대림", "2026-10-19T08:00:00Z", "d_1"),
    ]);

    expect(result.map((item) => item.endpoint.name)).toEqual(["대림"]);
  });
});
