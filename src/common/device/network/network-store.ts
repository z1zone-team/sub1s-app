import { create } from "zustand";

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string;
  isOffline: boolean;
  actions: {
    setNetworkState: (state: {
      isConnected: boolean;
      isInternetReachable: boolean | null;
      connectionType: string;
    }) => void;
  };
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isConnected: true,
  isInternetReachable: true,
  connectionType: "unknown",
  isOffline: false,
  actions: {
    setNetworkState: ({ isConnected, isInternetReachable, connectionType }) => {
      const isOffline = !isConnected || isInternetReachable === false;
      set({
        isConnected,
        isInternetReachable,
        connectionType,
        isOffline,
      });
    },
  },
}));
