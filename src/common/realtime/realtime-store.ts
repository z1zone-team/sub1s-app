import { create } from "zustand";
import type {
  TrainCongestionResponse,
  CarCongestionDto,
  SmartAlertPayload,
  OffRouteAlertPayload,
  JoinTrainPayload,
} from "./types";

export interface RealtimeState {
  isConnected: boolean;
  currentTrain: JoinTrainPayload | null;
  congestion: TrainCongestionResponse | null;
  cars: Record<number, CarCongestionDto>;
  latestAlert: SmartAlertPayload | OffRouteAlertPayload | null;
  actions: {
    setConnected: (connected: boolean) => void;
    setCurrentTrain: (train: JoinTrainPayload | null) => void;
    setCongestion: (congestion: TrainCongestionResponse) => void;
    setAlert: (alert: SmartAlertPayload | OffRouteAlertPayload) => void;
    clearAlert: () => void;
    reset: () => void;
  };
}

const initialState = {
  isConnected: false,
  currentTrain: null,
  congestion: null,
  cars: {},
  latestAlert: null,
};

export const useRealtimeStore = create<RealtimeState>((set) => ({
  ...initialState,
  actions: {
    setConnected: (connected) => set({ isConnected: connected }),
    setCurrentTrain: (currentTrain) => set({ currentTrain }),
    setCongestion: (congestion) => {
      const carsMap: Record<number, CarCongestionDto> = {};
      if (congestion && Array.isArray(congestion.cars)) {
        for (const car of congestion.cars) {
          carsMap[car.carNo] = car;
        }
      }
      set({
        congestion,
        cars: carsMap,
      });
    },
    setAlert: (latestAlert) => set({ latestAlert }),
    clearAlert: () => set({ latestAlert: null }),
    reset: () => set({ ...initialState }),
  },
}));

/**
 * 특정 열차 칸의 혼잡도만 구독하는 셀렉터 훅 (불필요한 리렌더링 방지)
 */
export function useCarCongestion(carNo: number): CarCongestionDto | undefined {
  return useRealtimeStore((state) => state.cars[carNo]);
}
