import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

const AMPLITUDE = 6;
const TOTAL_MS = 500;
const START_DELAY_MS = 150;

/** 나타난 뒤 잠시(기본 0.15초) 있다가 0.5초 동안 좌우로 흔들린다 (프로토타입의 shake: 0, -6, 6, -6, 6, 0px). 경고 배너와 실패 캐릭터에 쓴다 */
export function Shake({ children, delayMs = START_DELAY_MS }: { children: React.ReactNode; delayMs?: number }) {
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const step = TOTAL_MS / 5;
    const move = (toValue: number) =>
      Animated.timing(x, { toValue, duration: step, easing: Easing.inOut(Easing.ease), useNativeDriver: true });
    Animated.sequence([
      Animated.delay(delayMs),
      move(-AMPLITUDE),
      move(AMPLITUDE),
      move(-AMPLITUDE),
      move(AMPLITUDE),
      move(0),
    ]).start();
  }, [x, delayMs]);

  return <Animated.View style={{ transform: [{ translateX: x }] }}>{children}</Animated.View>;
}
