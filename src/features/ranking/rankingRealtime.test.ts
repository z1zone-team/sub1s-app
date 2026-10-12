import { bindRankingEvents, createRefreshScheduler, RANKING_REFRESH_DELAY_MS, type RankingEventSource } from "./rankingRealtime";

type Handler = (data?: unknown) => void;

function fakeSource() {
  const handlers = new Map<string, Set<Handler>>();
  const source = {
    on: jest.fn((event: string, handler: Handler) => {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(handler);
    }),
    off: jest.fn((event: string, handler: Handler) => {
      handlers.get(event)?.delete(handler);
    }),
  };
  const emit = (event: string, data?: unknown) => handlers.get(event)?.forEach((handler) => handler(data));
  const count = (event: string) => handlers.get(event)?.size ?? 0;
  return { source: source as unknown as RankingEventSource, emit, count };
}

describe("createRefreshScheduler", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("예약하고 지연이 지나면 한 번 갱신한다", () => {
    const refresh = jest.fn();
    const scheduler = createRefreshScheduler(refresh);

    scheduler.schedule();
    expect(refresh).not.toHaveBeenCalled();
    jest.advanceTimersByTime(RANKING_REFRESH_DELAY_MS);

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("지연 안에 여러 번 예약해도 한 번만 갱신한다", () => {
    const refresh = jest.fn();
    const scheduler = createRefreshScheduler(refresh);

    scheduler.schedule();
    scheduler.schedule();
    jest.advanceTimersByTime(RANKING_REFRESH_DELAY_MS / 2);
    scheduler.schedule();
    jest.advanceTimersByTime(RANKING_REFRESH_DELAY_MS);

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("갱신한 뒤에 온 신호는 다시 갱신한다", () => {
    const refresh = jest.fn();
    const scheduler = createRefreshScheduler(refresh);

    scheduler.schedule();
    jest.advanceTimersByTime(RANKING_REFRESH_DELAY_MS);
    scheduler.schedule();
    jest.advanceTimersByTime(RANKING_REFRESH_DELAY_MS);

    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("취소하면 갱신하지 않는다", () => {
    const refresh = jest.fn();
    const scheduler = createRefreshScheduler(refresh);

    scheduler.schedule();
    scheduler.cancel();
    jest.advanceTimersByTime(RANKING_REFRESH_DELAY_MS * 2);

    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("bindRankingEvents", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it.each([
    ["ranking_changed", { periodType: "MONTHLY", periodKey: "2026-10" }],
    ["ranking_update", { periodKey: "2026-10", currentPoints: 120 }],
    ["connect", undefined],
  ])("%s 신호가 오면 갱신한다", (event, data) => {
    const { source, emit } = fakeSource();
    const refresh = jest.fn();
    bindRankingEvents(source, refresh);

    emit(event, data);
    jest.advanceTimersByTime(RANKING_REFRESH_DELAY_MS);

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("전체 신호와 내 신호가 함께 와도 한 번만 갱신한다", () => {
    const { source, emit } = fakeSource();
    const refresh = jest.fn();
    bindRankingEvents(source, refresh);

    emit("ranking_update", { periodKey: "2026-10", currentPoints: 120 });
    emit("ranking_changed", { periodType: "MONTHLY", periodKey: "2026-10" });
    emit("ranking_changed", { periodType: "ALL", periodKey: "ALL" });
    jest.advanceTimersByTime(RANKING_REFRESH_DELAY_MS);

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("구독을 끝내면 이벤트를 받지 않고 예약된 갱신도 취소한다", () => {
    const { source, emit, count } = fakeSource();
    const refresh = jest.fn();
    const unbind = bindRankingEvents(source, refresh);

    emit("ranking_changed", { periodType: "ALL", periodKey: "ALL" });
    unbind();
    emit("ranking_changed", { periodType: "ALL", periodKey: "ALL" });
    jest.advanceTimersByTime(RANKING_REFRESH_DELAY_MS * 2);

    expect(refresh).not.toHaveBeenCalled();
    expect(count("ranking_changed")).toBe(0);
    expect(count("ranking_update")).toBe(0);
    expect(count("connect")).toBe(0);
  });
});
