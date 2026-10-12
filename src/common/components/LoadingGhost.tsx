import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { Text } from "./Text";

const FADE_MS = 200;
const SWAY_PX = 5;
const SWAY_MS = 1800;
const PRIMARY = "#002968";
const BODY =
  "M12 46V28a18 18 0 0 1 36 0v16C48 47 49.5 49 52 50.5C53.5 51.5 52.5 53.5 50 53.5C47.5 53.5 46.5 51.5 44.5 51.8C42.5 52.1 42 55 39 55C36 55 35.5 52.2 33 52.4C30.5 52.6 30 55.5 26.8 55.5C23.6 55.5 23.2 52.6 20.8 52.6C18 52.6 16.5 54 14.6 53C12.6 52 12 49.5 12 46z";

interface LoadingGhostProps {
  /** 자리를 차지하는 최소 높이(px). 본문이 들어갈 만큼 크게 잡는다 */
  minHeight?: number;
  /** MY는 면(surface) 색, 랭킹과 타임라인은 배경색 위에 얹는다 */
  tone?: "bg" | "surface";
}

/**
 * 프로토타입의 로딩 표시: 0.2초 페이드인, 캐릭터가 위아래 5px로 1.8초 주기로 흔들리고(gsw) "불러오는 중이에요".
 * 목록 화면이 처음 데이터를 기다리는 동안 본문 자리에 대신 보인다
 */
export function LoadingGhost({ minHeight = 360, tone = "bg" }: LoadingGhostProps) {
  const fade = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: FADE_MS, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    sway.setValue(-SWAY_PX);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: SWAY_PX, duration: SWAY_MS / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(sway, { toValue: -SWAY_PX, duration: SWAY_MS / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [fade, sway]);

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="불러오는 중이에요"
      className={tone === "surface" ? "flex-1 items-center justify-center gap-3 bg-surface pb-10" : "flex-1 items-center justify-center gap-3 bg-bg pb-10"}
      style={{ minHeight, opacity: fade }}
    >
      <Animated.View style={{ transform: [{ translateY: sway }] }}>
        <Svg width={56} height={56} viewBox="0 0 64 64" fill="none">
          <Path d={BODY} fill="#FFFFFF" stroke={PRIMARY} strokeWidth={2.4} strokeLinejoin="round" />
          <Circle cx={24} cy={29} r={2.6} fill={PRIMARY} />
          <Circle cx={36} cy={29} r={2.6} fill={PRIMARY} />
          <Path d="M26.5 36.5q3.5 3 7 0" stroke={PRIMARY} strokeWidth={2.2} strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>
      <View>
        <Text className="text-body-sm font-sans-semibold text-text-secondary">불러오는 중이에요</Text>
      </View>
    </Animated.View>
  );
}
