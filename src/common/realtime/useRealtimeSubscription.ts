import { useEffect, useCallback } from "react";
import { subwaySocketClient } from "./socket-client";
import { useRealtimeStore } from "./realtime-store";
import type {
  JoinTrainPayload,
  ReportLocationPayload,
  TrainCongestionDto,
  EtaTickPayload,
  SmartAlertPayload,
  OffRouteAlertPayload,
} from "./types";

export function useRealtimeSubscription(train?: JoinTrainPayload | null) {
  const isConnected = useRealtimeStore((state) => state.isConnected);
  const congestion = useRealtimeStore((state) => state.congestion);
  const eta = useRealtimeStore((state) => state.eta);
  const latestAlert = useRealtimeStore((state) => state.latestAlert);
  const actions = useRealtimeStore((state) => state.actions);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      const socket = await subwaySocketClient.connect();
      if (!isMounted) return;

      const onCongestionTick = (data: TrainCongestionDto) => {
        actions.setCongestion(data);
      };

      const onEtaTick = (data: EtaTickPayload) => {
        actions.setEta(data);
      };

      const onSmartAlert = (data: SmartAlertPayload) => {
        actions.setAlert(data);
      };

      const onOffRouteAlert = (data: OffRouteAlertPayload) => {
        actions.setAlert(data);
      };

      socket.on("congestion_tick", onCongestionTick);
      socket.on("eta_tick", onEtaTick);
      socket.on("smart_alert", onSmartAlert);
      socket.on("offroute_alert", onOffRouteAlert);

      if (train) {
        subwaySocketClient.joinTrain(train);
      }

      return () => {
        socket.off("congestion_tick", onCongestionTick);
        socket.off("eta_tick", onEtaTick);
        socket.off("smart_alert", onSmartAlert);
        socket.off("offroute_alert", onOffRouteAlert);
        if (train) {
          subwaySocketClient.leaveTrain(train);
        }
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
    eta,
    latestAlert,
    clearAlert: actions.clearAlert,
    reportLocation,
  };
}
