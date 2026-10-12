import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, View } from "react-native";
import Ghost from "@assets/svg/ghost-load-fail.svg";
import { DesignIcon } from "./DesignIcon";
import { Text } from "./Text";

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
        <Ghost width={88} height={88} />
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
