import type { RankingChangedPayload, RankingUpdatePayload } from "@/common/realtime/types";

/** 랭킹 이벤트를 받을 수 있는 소켓의 최소 모양. 테스트에서 가짜로 바꾸기 쉽게 좁혔다 */
export interface RankingEventSource {
  on(event: "ranking_changed", handler: (data: RankingChangedPayload) => void): unknown;
  on(event: "ranking_update", handler: (data: RankingUpdatePayload) => void): unknown;
  on(event: "connect", handler: () => void): unknown;
  off(event: "ranking_changed", handler: (data: RankingChangedPayload) => void): unknown;
  off(event: "ranking_update", handler: (data: RankingUpdatePayload) => void): unknown;
  off(event: "connect", handler: () => void): unknown;
}

/** 이동이 몰려서 이벤트가 연달아 와도 짧은 시간 안에는 한 번만 다시 불러온다 */
export const RANKING_REFRESH_DELAY_MS = 1000;

export interface RefreshScheduler {
  schedule: () => void;
  cancel: () => void;
}

export function createRefreshScheduler(refresh: () => void, delayMs: number = RANKING_REFRESH_DELAY_MS): RefreshScheduler {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    schedule: () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        refresh();
      }, delayMs);
    },
    cancel: () => {
      if (timer) clearTimeout(timer);
      timer = null;
    },
  };
}

/**
 * 랭킹이 바뀌었다는 신호(`ranking_changed`, `ranking_update`)와 재연결(`connect`)에서 갱신을 예약한다.
 * 재연결에서도 갱신하는 것은 끊겨 있던 사이의 변화를 놓치지 않기 위해서다. 돌려주는 함수로 구독을 끝낸다
 */
export function bindRankingEvents(source: RankingEventSource, refresh: () => void, delayMs?: number): () => void {
  const scheduler = createRefreshScheduler(refresh, delayMs);
  const onSignal = () => scheduler.schedule();

  source.on("ranking_changed", onSignal);
  source.on("ranking_update", onSignal);
  source.on("connect", onSignal);

  return () => {
    source.off("ranking_changed", onSignal);
    source.off("ranking_update", onSignal);
    source.off("connect", onSignal);
    scheduler.cancel();
  };
}
