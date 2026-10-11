import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

const STORAGE_KEY = "sub1s.guest-browsing";

interface GuestState {
  loaded: boolean;
  chosen: boolean;
  hydrate: () => Promise<void>;
  choose: () => Promise<void>;
}

/** 로그인 없이 둘러보기를 골랐는지 기억해 다음 실행부터 로그인 화면을 건너뛴다 */
export const useGuestStore = create<GuestState>((set) => ({
  loaded: false,
  chosen: false,

  hydrate: async () => {
    try {
      const value = await SecureStore.getItemAsync(STORAGE_KEY);
      set({ loaded: true, chosen: value === "1" });
    } catch {
      set({ loaded: true, chosen: false });
    }
  },

  choose: async () => {
    set({ chosen: true });
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, "1");
    } catch {
      // 저장에 실패해도 이번 실행에서는 둘러보기를 계속한다
    }
  },
}));
