import type { SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { useActiveGuideStore } from "./active-guide-store";

const option = { totalDurationSec: 1800 } as unknown as SubwayRouteOptionDto;

beforeEach(() => useActiveGuideStore.getState().end());

describe("active guide store", () => {
  it("안내를 시작하면 전체 소요 시간을 남은 시간으로 둔다", () => {
    useActiveGuideStore.getState().begin({ sessionId: "s1", option, startedAtMs: 10 });
    expect(useActiveGuideStore.getState().guide).toMatchObject({ sessionId: "s1", remainingSec: 1800 });
  });

  it("남은 시간을 갱신한다", () => {
    useActiveGuideStore.getState().begin({ sessionId: "s1", option, startedAtMs: 10 });
    useActiveGuideStore.getState().setRemaining(900);
    expect(useActiveGuideStore.getState().guide?.remainingSec).toBe(900);
  });

  it("같은 세션으로 다시 시작해도 남은 시간을 되돌리지 않는다", () => {
    useActiveGuideStore.getState().begin({ sessionId: "s1", option, startedAtMs: 10 });
    useActiveGuideStore.getState().setRemaining(900);
    useActiveGuideStore.getState().begin({ sessionId: "s1", option, startedAtMs: 10 });
    expect(useActiveGuideStore.getState().guide?.remainingSec).toBe(900);
  });

  it("다른 세션이면 새로 시작한다", () => {
    useActiveGuideStore.getState().begin({ sessionId: "s1", option, startedAtMs: 10 });
    useActiveGuideStore.getState().setRemaining(900);
    useActiveGuideStore.getState().begin({ sessionId: "s2", option, startedAtMs: 20 });
    expect(useActiveGuideStore.getState().guide).toMatchObject({ sessionId: "s2", remainingSec: 1800 });
  });

  it("처음에는 아직 아무 열차도 타지 않은 상태다", () => {
    useActiveGuideStore.getState().begin({ sessionId: "s1", option, startedAtMs: 10 });
    expect(useActiveGuideStore.getState().guide?.progress).toEqual({ phase: { boardedRides: 0, stationReached: false } });
  });

  it("진행을 기억하고 같은 세션으로 다시 시작해도 되돌리지 않는다", () => {
    useActiveGuideStore.getState().begin({ sessionId: "s1", option, startedAtMs: 10 });
    useActiveGuideStore.getState().setProgress({ anchor: { index: 2, atMs: 50 }, phase: { boardedRides: 1, stationReached: true } });
    useActiveGuideStore.getState().begin({ sessionId: "s1", option, startedAtMs: 10 });
    expect(useActiveGuideStore.getState().guide?.progress).toEqual({
      anchor: { index: 2, atMs: 50 },
      phase: { boardedRides: 1, stationReached: true },
    });
  });

  it("다른 세션이면 진행도 처음으로 돌아간다", () => {
    useActiveGuideStore.getState().begin({ sessionId: "s1", option, startedAtMs: 10 });
    useActiveGuideStore.getState().setProgress({ phase: { boardedRides: 1, stationReached: true } });
    useActiveGuideStore.getState().begin({ sessionId: "s2", option, startedAtMs: 20 });
    expect(useActiveGuideStore.getState().guide?.progress.phase.boardedRides).toBe(0);
  });

  it("안내가 없을 때 진행을 기억시켜도 아무 일도 없다", () => {
    useActiveGuideStore.getState().setProgress({ phase: { boardedRides: 1, stationReached: true } });
    expect(useActiveGuideStore.getState().guide).toBeNull();
  });

  it("안내가 없을 때 남은 시간을 갱신해도 아무 일도 없다", () => {
    useActiveGuideStore.getState().setRemaining(10);
    expect(useActiveGuideStore.getState().guide).toBeNull();
  });

  it("끝내면 비운다", () => {
    useActiveGuideStore.getState().begin({ sessionId: "s1", option, startedAtMs: 10 });
    useActiveGuideStore.getState().end();
    expect(useActiveGuideStore.getState().guide).toBeNull();
  });
});
