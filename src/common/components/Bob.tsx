import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

const LIFT = 6;
/** 프로토타입의 bob: 2초 주기로 6px 올라갔다 내려온다 */
const HALF_CYCLE_MS = 1000;

/** 캐릭터처럼 가만히 위아래로 떠다니는 요소 */
export function Bob({ children }: { children: React.ReactNode }) {
  const y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: -LIFT, duration: HALF_CYCLE_MS, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: HALF_CYCLE_MS, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [y]);

  return <Animated.View style={{ transform: [{ translateY: y }] }}>{children}</Animated.View>;
}
