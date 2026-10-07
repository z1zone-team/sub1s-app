import { create } from "zustand";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  durationMs?: number;
}

export interface ToastState {
  toasts: ToastItem[];
  actions: {
    showToast: (toast: Omit<ToastItem, "id">) => string;
    hideToast: (id: string) => void;
    clearToasts: () => void;
  };
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  actions: {
    showToast: (toast) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { ...toast, id };
      set((state) => ({ toasts: [...state.toasts, newToast] }));
      return id;
    },
    hideToast: (id) => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    },
    clearToasts: () => {
      set({ toasts: [] });
    },
  },
}));
