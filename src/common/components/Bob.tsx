import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

const LIFT = 6;
/** 프로토타입의 bob: 2초 주기로 6px 올라갔다 내려온다 */
const HALF_CYCLE_MS = 1000;

interface BobProps {
  children: React.ReactNode;
  /** 올라가는 높이(px). MY 프로필 캐릭터는 3px */
  lift?: number;
  /** 한 번 오르내리는 데 걸리는 시간(ms). MY 프로필 캐릭터는 2400 */
  periodMs?: number;
}

/** 캐릭터처럼 가만히 위아래로 떠다니는 요소 */
export function Bob({ children, lift = LIFT, periodMs = HALF_CYCLE_MS * 2 }: BobProps) {
  const y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: -lift, duration: periodMs / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: periodMs / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [y, lift, periodMs]);

  return <Animated.View style={{ transform: [{ translateY: y }] }}>{children}</Animated.View>;
}
