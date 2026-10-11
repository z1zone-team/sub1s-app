import { create } from "zustand";

interface OffRouteState {
  /** "맞게 탔어요"를 누른 뒤 경로 위의 역이 확인되기 전까지 true */
  dismissed: boolean;
  dismiss: () => void;
  reset: () => void;
}

export const useOffRouteStore = create<OffRouteState>((set) => ({
  dismissed: false,
  dismiss: () => set({ dismissed: true }),
  reset: () => set({ dismissed: false }),
}));
