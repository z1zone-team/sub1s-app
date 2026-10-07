import { useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useNetworkStore } from "./network-store";

export function useNetworkStatus() {
  const isConnected = useNetworkStore((state) => state.isConnected);
  const isInternetReachable = useNetworkStore((state) => state.isInternetReachable);
  const connectionType = useNetworkStore((state) => state.connectionType);
  const isOffline = useNetworkStore((state) => state.isOffline);
  const setNetworkState = useNetworkStore((state) => state.actions.setNetworkState);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkState({
        isConnected: Boolean(state.isConnected),
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [setNetworkState]);

  return {
    isConnected,
    isInternetReachable,
    connectionType,
    isOffline,
  };
}
