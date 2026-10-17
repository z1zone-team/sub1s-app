import { create } from "zustand";
import type { SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import type { RouteEndpoint } from "@/features/routing/endpoint";
import { INITIAL_PHASE_STATE, type PhaseState } from "./guidePhase";
import type { Anchor } from "./progress";

/** 안내 화면이 기억하는 진행. 홈에 다녀와서 안내 화면을 다시 열어도 이어진다 */
export interface GuideProgressMemory {
  /** 사용자가 알려 주거나 위치로 확인한 역과 그 시각 */
  anchor?: Anchor;
  phase: PhaseState;
}

export const INITIAL_PROGRESS_MEMORY: GuideProgressMemory = { phase: INITIAL_PHASE_STATE };

export interface ActiveGuide {
  sessionId: string;
  option: SubwayRouteOptionDto;
  startedAtMs: number;
  /** 지도에 걷는 구간을 그리려고 기억해 두는 출발지와 도착지. 홈에서 안내로 돌아갈 때 다시 넘긴다 */
  origin?: RouteEndpoint;
  destination?: RouteEndpoint;
  /** 안내 화면이 계산한 남은 시간(초). 홈의 복귀 버튼이 보여 준다 */
  remainingSec: number;
  progress: GuideProgressMemory;
}

interface ActiveGuideState {
  guide: ActiveGuide | null;
  begin: (guide: Omit<ActiveGuide, "remainingSec" | "progress">) => void;
  setRemaining: (remainingSec: number) => void;
  setProgress: (progress: GuideProgressMemory) => void;
  end: () => void;
}

/** 안내 중인 이동. 앱 메모리에만 있어서 앱을 완전히 종료하면 사라진다 */
export const useActiveGuideStore = create<ActiveGuideState>((set) => ({
  guide: null,

  begin: (guide) =>
    set((state) => {
      const same = state.guide?.sessionId === guide.sessionId ? state.guide : undefined;
      return {
        guide: {
          ...guide,
          remainingSec: same ? same.remainingSec : guide.option.totalDurationSec,
          progress: same ? same.progress : INITIAL_PROGRESS_MEMORY,
        },
      };
    }),

  setRemaining: (remainingSec) =>
    set((state) => (state.guide ? { guide: { ...state.guide, remainingSec } } : state)),

  setProgress: (progress) =>
    set((state) => (state.guide ? { guide: { ...state.guide, progress } } : state)),

  end: () => set({ guide: null }),
}));
