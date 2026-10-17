import { create } from "zustand";
import type { SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import type { RouteEndpoint } from "@/features/routing/endpoint";

export interface ActiveGuide {
  sessionId: string;
  option: SubwayRouteOptionDto;
  startedAtMs: number;
  /** 지도에 걷는 구간을 그리려고 기억해 두는 출발지와 도착지. 홈에서 안내로 돌아갈 때 다시 넘긴다 */
  origin?: RouteEndpoint;
  destination?: RouteEndpoint;
  /** 안내 화면이 계산한 남은 시간(초). 홈의 복귀 버튼이 보여 준다 */
  remainingSec: number;
}

interface ActiveGuideState {
  guide: ActiveGuide | null;
  begin: (guide: Omit<ActiveGuide, "remainingSec">) => void;
  setRemaining: (remainingSec: number) => void;
  end: () => void;
}

/** 안내 중인 이동. 앱 메모리에만 있어서 앱을 완전히 종료하면 사라진다 */
export const useActiveGuideStore = create<ActiveGuideState>((set) => ({
  guide: null,

  begin: (guide) =>
    set((state) => ({
      guide: {
        ...guide,
        remainingSec:
          state.guide?.sessionId === guide.sessionId
            ? state.guide.remainingSec
            : guide.option.totalDurationSec,
      },
    })),

  setRemaining: (remainingSec) =>
    set((state) => (state.guide ? { guide: { ...state.guide, remainingSec } } : state)),

  end: () => set({ guide: null }),
}));
