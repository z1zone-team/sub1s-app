import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

const LOW_OPACITY = 0.35;
/** 프로토타입의 blink: 1.4초 주기로 투명도가 1과 0.35를 오간다 */
const HALF_CYCLE_MS = 700;

/** 안내 중 표시처럼 계속 깜빡이는 요소 */
export function Blink({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: LOW_OPACITY, duration: HALF_CYCLE_MS, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: HALF_CYCLE_MS, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}
