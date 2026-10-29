import { useEffect, useState } from "react";

/** 스플래시를 최소로 보여 주는 시간(ms). 나타나기 0.5초 + 유령이 한쪽으로 한 번 흔들리는 시간 */
export const SPLASH_MIN_MS = 1500;

/** 앱이 시작된 시각. 이 파일을 처음 읽을 때(앱 시작 직후) 정해진다 */
const launchedAt = Date.now();

/** 최소 표시 시간까지 남은 시간(ms). 이미 지났으면 0 */
export function splashRemainingMs(now: number = Date.now(), startedAt: number = launchedAt, minMs: number = SPLASH_MIN_MS): number {
  return Math.max(0, minMs - (now - startedAt));
}

/** 앱 시작 뒤 최소 표시 시간이 지났는지. 로딩이 빨리 끝나도 이 시간까지는 스플래시를 보여 준다 */
export function useSplashMinimumElapsed(): boolean {
  const [elapsed, setElapsed] = useState(() => splashRemainingMs() === 0);
  useEffect(() => {
    if (elapsed) return undefined;
    const timer = setTimeout(() => setElapsed(true), splashRemainingMs());
    return () => clearTimeout(timer);
  }, [elapsed]);
  return elapsed;
}
