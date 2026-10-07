import {
  saveWidgetSnapshot,
  getWidgetSnapshot,
  createWidgetDeepLink,
} from "./widget-bridge";
import type { WidgetSnapshot } from "./widget-types";

describe("Widget Bridge", () => {
  it("should save and retrieve widget snapshot", async () => {
    const snapshot: WidgetSnapshot = {
      nextTrain: {
        line: "2호선",
        stationName: "신도림",
        remainingSec: 120,
        direction: "문래 방면",
      },
      recentRoutes: [
        {
          origin: "신도림",
          destination: "강남",
        },
      ],
      updatedAt: "2026-10-07T12:00:00Z",
    };

    await saveWidgetSnapshot(snapshot);
    const retrieved = await getWidgetSnapshot();

    expect(retrieved).toBeDefined();
    expect(retrieved?.nextTrain?.stationName).toBe("신도림");
    expect(retrieved?.recentRoutes?.[0].destination).toBe("강남");
  });

  it("should create formatted widget deep link URLs", () => {
    const nextTrainLink = createWidgetDeepLink("next-train", {
      stationId: "234",
    });
    expect(nextTrainLink).toBe("sub1s://widget/next-train?stationId=234");

    const routeLink = createWidgetDeepLink("route", {
      origin: "신도림",
      destination: "강남",
    });
    expect(routeLink).toBe("sub1s://widget/route?origin=%EC%8B%A0%EB%8F%84%EB%A6%BC&destination=%EA%B0%95%EB%82%A8");
  });
});
