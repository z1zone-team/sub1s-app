import type { ServiceWarning } from "@/apis/queries/routing/searchRoutes";
import { serviceWarningView } from "./serviceWarningView";

describe("serviceWarningView", () => {
  // 2026-10-20(화) 00:45 KST
  const now = Date.parse("2026-10-20T00:45:00+09:00");
  const base: ServiceWarning = { status: "AFTER_LAST_TRAIN", lineId: "02", stationId: "02_222", stationName: "강남" };

  it("막차가 끊겼으면 다음 첫차와 그에 맞춘 출발 시각으로 다시 찾는 버튼을 준다", () => {
    const view = serviceWarningView(
      { ...base, nextTrainAt: "2026-10-20T05:36:00.000+09:00", suggestedDepartureAt: "2026-10-20T05:26:00.000+09:00" },
      now
    );

    expect(view.title).toBe("강남역 막차가 끊겼어요");
    expect(view.detail).toBe("다음 첫차는 오늘 05:36에 있어요");
    expect(view.retry).toEqual({ label: "오늘 05:26 출발로 다시 찾기", departureMs: Date.parse("2026-10-20T05:26:00+09:00") });
  });

  it("다음 날 첫차면 날짜를 내일로 쓴다", () => {
    const late = Date.parse("2026-10-19T23:50:00+09:00");
    const view = serviceWarningView(
      { ...base, nextTrainAt: "2026-10-20T05:36:00.000+09:00", suggestedDepartureAt: "2026-10-20T05:26:00.000+09:00" },
      late
    );

    expect(view.detail).toBe("다음 첫차는 내일 05:36에 있어요");
    expect(view.retry?.label).toBe("내일 05:26 출발로 다시 찾기");
  });

  it("첫차 전이면 그 역이 첫차 전이라고 알린다", () => {
    const view = serviceWarningView(
      { ...base, status: "BEFORE_FIRST_TRAIN", nextTrainAt: "2026-10-20T05:36:00.000+09:00", suggestedDepartureAt: "2026-10-20T05:26:00.000+09:00" },
      Date.parse("2026-10-20T04:30:00+09:00")
    );

    expect(view.title).toBe("강남역 첫차 전이에요");
    expect(view.retry?.label).toBe("오늘 05:26 출발로 다시 찾기");
  });

  it("다음 첫차를 모르면 열차가 없다는 말만 하고 다시 찾기는 주지 않는다", () => {
    const view = serviceWarningView(base, now);

    expect(view.detail).toBe("이 시각에는 탈 수 있는 열차가 없어요");
    expect(view.retry).toBeUndefined();
  });

  it("제안한 출발 시각이 이미 지났으면 다시 찾기를 주지 않는다", () => {
    const view = serviceWarningView(
      { ...base, nextTrainAt: "2026-10-20T00:30:00.000+09:00", suggestedDepartureAt: "2026-10-20T00:20:00.000+09:00" },
      now
    );

    expect(view.retry).toBeUndefined();
  });
});
