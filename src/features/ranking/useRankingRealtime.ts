import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subwaySocketClient, type SubwaySocket } from "@/common/realtime";
import { queryKeys } from "@/constants/queryKeys";
import { bindRankingEvents } from "./rankingRealtime";

/**
 * 랭킹 화면이 보이는 동안 서버의 랭킹 변화 신호를 받아 랭킹과 이달 통계를 다시 불러온다.
 * enabled가 꺼지면(로그인하지 않았거나 화면을 벗어남) 구독과 연결을 끝낸다
 */
export function useRankingRealtime(enabled: boolean): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    let unbind: (() => void) | null = null;
    let socket: SubwaySocket | null = null;

    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ranking.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.stats("MONTH") });
    };

    subwaySocketClient
      .retain()
      .then((connected) => {
        socket = connected;
        if (!active) {
          subwaySocketClient.release();
          return;
        }
        unbind = bindRankingEvents(connected, refresh);
      })
      .catch(() => {
        // 연결하지 못해도 랭킹은 불러올 때 한 번 읽은 값으로 보인다
      });

    return () => {
      active = false;
      unbind?.();
      if (socket) subwaySocketClient.release();
    };
  }, [enabled, queryClient]);
}
