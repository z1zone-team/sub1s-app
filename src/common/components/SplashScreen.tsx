import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import { BrandLogo } from "./BrandLogo";

/** 프로토타입 Splash.dc.html: 로고는 항상 파란 바탕 위라서 다크 모드와 상관없이 같은 색을 쓴다 */
const SPLASH_BACKGROUND = "#002968";
const LOGO_SIZE = 200;
const LOGO_RADIUS = 46;
const APPEAR_MS = 500;
const START_SCALE = 0.92;

/** 폰트와 로그인 상태를 읽는 동안 보이는 화면. 로고가 0.5초 동안 92%에서 100%로 커지며 나타난다(appear) */
export function SplashScreen() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: APPEAR_MS,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: SPLASH_BACKGROUND }}>
      <Animated.View
        style={{
          opacity: progress,
          transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [START_SCALE, 1] }) }],
        }}
      >
        <BrandLogo size={LOGO_SIZE} radius={LOGO_RADIUS} />
      </Animated.View>
    </View>
  );
}
