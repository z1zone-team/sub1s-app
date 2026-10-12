import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

const RISE_DISTANCE = 10;
const RISE_MS = 350;
/** 프로토타입의 cubic-bezier(.2, .8, .2, 1) */
const EASING = Easing.bezier(0.2, 0.8, 0.2, 1);

/** 처음 나타날 때 아래에서 10px 올라오며 나타나는 효과 (프로토타입의 rise 애니메이션, 0.35초) */
export function RiseIn({ children, delayMs = 0 }: { children: React.ReactNode; delayMs?: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: RISE_MS,
      delay: delayMs,
      easing: EASING,
      useNativeDriver: true,
    }).start();
  }, [progress, delayMs]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [RISE_DISTANCE, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}
