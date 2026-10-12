import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

const RISE_DISTANCE = 10;
const RISE_MS = 350;
/** 프로토타입의 cubic-bezier(.2, .8, .2, 1) */
const EASING = Easing.bezier(0.2, 0.8, 0.2, 1);

interface RiseInProps {
  children: React.ReactNode;
  delayMs?: number;
  /** 시작 위치의 세로 오프셋(px). 양수면 아래에서 올라오고 음수면 위에서 내려온다 */
  from?: number;
  durationMs?: number;
}

/**
 * 처음 나타날 때 조금 움직이며 나타나는 효과. 기본은 아래에서 10px 올라오는 프로토타입의 rise(0.35초)이고,
 * from과 durationMs로 안내 화면의 drop(위에서 14px, 0.4초)과 pop(아래에서 16px, 0.4초)도 낸다
 */
export function RiseIn({ children, delayMs = 0, from = RISE_DISTANCE, durationMs = RISE_MS }: RiseInProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: durationMs,
      delay: delayMs,
      easing: EASING,
      useNativeDriver: true,
    }).start();
  }, [progress, delayMs, durationMs]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}
