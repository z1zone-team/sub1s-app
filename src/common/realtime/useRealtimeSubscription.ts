import { useEffect, useCallback } from "react";
import { subwaySocketClient } from "./socket-client";
import { useRealtimeStore } from "./realtime-store";
import type {
  JoinTrainPayload,
  ReportLocationPayload,
  TrainCongestionResponse,
  SmartAlertPayload,
  OffRouteAlertPayload,
} from "./types";

export function useRealtimeSubscription(train?: JoinTrainPayload | null) {
  const isConnected = useRealtimeStore((state) => state.isConnected);
  const congestion = useRealtimeStore((state) => state.congestion);
  const latestAlert = useRealtimeStore((state) => state.latestAlert);
  const actions = useRealtimeStore((state) => state.actions);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      const socket = await subwaySocketClient.retain();
      if (!isMounted) {
        subwaySocketClient.release();
        return;
      }

      const onCongestionTick = (data: TrainCongestionResponse) => {
        actions.setCongestion(data);
      };

      const onSmartAlert = (data: SmartAlertPayload) => {
        actions.setAlert(data);
      };

      const onOffRouteAlert = (data: OffRouteAlertPayload) => {
        actions.setAlert(data);
      };

      socket.on("congestion_tick", onCongestionTick);
      socket.on("smart_alert", onSmartAlert);
      socket.on("offroute_alert", onOffRouteAlert);

      if (train) {
        subwaySocketClient.joinTrain(train);
      }

      return () => {
        socket.off("congestion_tick", onCongestionTick);
        socket.off("smart_alert", onSmartAlert);
        socket.off("offroute_alert", onOffRouteAlert);
        if (train) {
          subwaySocketClient.leaveTrain(train);
        }
        subwaySocketClient.release();
      };
    }

    const cleanupPromise = init();

    return () => {
      isMounted = false;
      void cleanupPromise.then((cleanup) => {
        if (cleanup) cleanup();
      });
    };
  }, [train?.lineId, train?.trainId]);

  const reportLocation = useCallback((payload: ReportLocationPayload) => {
    subwaySocketClient.reportLocation(payload);
  }, []);

  return {
    isConnected,
    congestion,
    latestAlert,
    clearAlert: actions.clearAlert,
    reportLocation,
  };
}
