import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { DesignIcon } from "./DesignIcon";
import { Text } from "./Text";

const PRIMARY = "#002968";
const ACCENT = "#0072CE";
const BODY =
  "M12 46V28a18 18 0 0 1 36 0v16C48 47 49.5 49 52 50.5C53.5 51.5 52.5 53.5 50 53.5C47.5 53.5 46.5 51.5 44.5 51.8C42.5 52.1 42 55 39 55C36 55 35.5 52.2 33 52.4C30.5 52.6 30 55.5 26.8 55.5C23.6 55.5 23.2 52.6 20.8 52.6C18 52.6 16.5 54 14.6 53C12.6 52 12 49.5 12 46z";
const DROOP_TOP = -4;
const DROOP_BOTTOM = 5;
const DROOP_MS = 1800;
/** 프로토타입은 안내가 화면 한가운데보다 약간 위에 오도록 아래를 150px 비운다 */
const BOTTOM_SPACE = 150;

interface LoadFailViewProps {
  title: string;
  body: string;
  onRetry: () => void;
}

/** 힘없이 눈을 감고 땀을 흘리는 유령. 프로토타입 LoadFail.dc.html의 SVG 경로 그대로 (64 x 64 viewBox) */
function SadGhost({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path d={BODY} fill="#FFFFFF" stroke={PRIMARY} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M20.5 30.5q3.5-2.5 7 0M32.5 30.5q3.5-2.5 7 0" stroke={PRIMARY} strokeWidth={2} strokeLinecap="round" />
      <Path d="M26 40q4-3.2 8 0" stroke={PRIMARY} strokeWidth={2} strokeLinecap="round" />
      <Path d="M43.5 23.5c0 2.2-1.6 3.6-1.6 3.6s-1.6-1.4-1.6-3.6c0-1.6 1.6-3.3 1.6-3.3s1.6 1.7 1.6 3.3z" fill={ACCENT} />
    </Svg>
  );
}

/**
 * 불러오기 실패 안내. 캐릭터가 위아래로 천천히 처지고(droop: -4px와 5px 사이 1.8초) 아래에 제목, 안내, 다시 시도 버튼이 온다.
 * 목록 화면의 헤더와 탭은 그대로 두고 본문 자리에 끼워 쓴다
 */
export function LoadFailView({ title, body, onRetry }: LoadFailViewProps) {
  const y = useRef(new Animated.Value(DROOP_TOP)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: DROOP_BOTTOM, duration: DROOP_MS / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(y, { toValue: DROOP_TOP, duration: DROOP_MS / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [y]);

  return (
    <View accessibilityRole="alert" className="flex-1 items-center justify-center px-8" style={{ paddingBottom: BOTTOM_SPACE, minHeight: 420 }}>
      <Animated.View style={{ transform: [{ translateY: y }] }}>
        <SadGhost size={88} />
      </Animated.View>
      <Text className="mt-5 text-center text-title-lg font-sans-bold">{title}</Text>
      <Text className="mt-2 text-center text-body leading-relaxed text-text-secondary">{body}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        className="mt-6 h-12 flex-row items-center gap-2 rounded-md-plus bg-primary px-5.5"
      >
        <DesignIcon name="retry" size={18} tone="onPrimary" />
        <Text className="text-subtitle font-sans-bold text-on-primary">다시 시도</Text>
      </Pressable>
    </View>
  );
}
