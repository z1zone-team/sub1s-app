import { create } from "zustand";
import type { SearchRow } from "@/features/routing/searchRows";

interface SelectedPlaceState {
  /** 지도 검색에서 고른 장소. 홈이 핀과 하단 카드로 보여 준다 */
  place: SearchRow | null;
  select: (place: SearchRow) => void;
  clear: () => void;
}

/** 앱 메모리에만 있다. 지도 검색 화면에서 고른 장소를 홈으로 넘긴다 */
export const useSelectedPlaceStore = create<SelectedPlaceState>((set) => ({
  place: null,
  select: (place) => set({ place }),
  clear: () => set({ place: null }),
}));
