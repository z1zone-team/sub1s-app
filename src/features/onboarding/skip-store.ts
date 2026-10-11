import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

const keyOf = (userId: string) => `sub1s.onboarding-skipped.${userId}`;

interface SkipState {
  /** 이 기기에서 설문을 건너뛴 사용자 */
  skipped: Record<string, true>;
  /** 저장된 값을 읽어 오기 전에는 건너뛰었는지 알 수 없다 */
  loadedFor: string | null;
  hydrate: (userId: string) => Promise<void>;
  skip: (userId: string) => Promise<void>;
}

export const useOnboardingSkipStore = create<SkipState>((set) => ({
  skipped: {},
  loadedFor: null,

  hydrate: async (userId) => {
    let value: string | null = null;
    try {
      value = await SecureStore.getItemAsync(keyOf(userId));
    } catch {
      value = null;
    }
    set((state) => ({
      loadedFor: userId,
      skipped: value === "1" ? { ...state.skipped, [userId]: true } : state.skipped,
    }));
  },

  skip: async (userId) => {
    set((state) => ({ skipped: { ...state.skipped, [userId]: true } }));
    try {
      await SecureStore.setItemAsync(keyOf(userId), "1");
    } catch {
      // 저장에 실패해도 이번 실행에서는 다시 묻지 않는다
    }
  },
}));
