import React, { useEffect } from "react";
import { Animated, Easing, View } from "react-native";

/** 유령을 뺀 로고 바탕과 유령. 프로토타입 Splash.dc.html과 같은 그림이다 */
const LOGO_BASE = require("../../../assets/splash/logo-base.png");
const LOGO_GHOST = require("../../../assets/splash/logo-ghost.png");

/** 프로토타입 Splash.dc.html: 로고는 항상 파란 바탕 위라서 다크 모드와 상관없이 같은 색을 쓴다 */
const SPLASH_BACKGROUND = "#002968";
const LOGO_SIZE = 200;
const LOGO_RADIUS = 46;
const APPEAR_MS = 500;
const START_SCALE = 0.92;
/** 프로토타입은 로고 그림을 105%로 키워 둥근 모서리 밖의 흰 테두리를 숨긴다 */
const ART_SCALE = 1.05;
/** 200px 로고 안에서 유령의 자리(px). 프로토타입 좌표 그대로 */
const GHOST = { left: 94.92, top: 83.59, width: 35.16, height: 38.28 };
/** 손잡이를 잡은 손(유령 그림의 왼쪽 위)을 중심으로 좌우 2.4도씩, 한 번 왕복에 2.2초 */
const SWING_DEG = 2.4;
const SWING_MS = 2200;
const SWING_ORIGIN = "13.9% 1%";
const SWING_EASING = Easing.bezier(0.45, 0, 0.55, 1);

/**
 * 폰트를 읽는 동안(App)과 로그인 상태를 읽는 동안(RootNavigator) 스플래시가 이어서 두 번 그려진다.
 * 값을 화면 밖에 두어 두 번째로 그려질 때 나타나기를 처음부터 다시 하지 않고 이어 간다
 */
const progress = new Animated.Value(0);
const swing = new Animated.Value(0);
let appearStarted = false;

/**
 * 폰트와 로그인 상태를 읽는 동안(최소 1.5초) 보이는 화면. 로고가 0.5초 동안 92%에서 100%로 커지며 나타나고(appear),
 * 'b'의 유령이 열차 손잡이를 잡은 채 좌우로 흔들린다(swing)
 */
export function SplashScreen() {
  useEffect(() => {
    if (!appearStarted) {
      appearStarted = true;
      Animated.timing(progress, {
        toValue: 1,
        duration: APPEAR_MS,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: true,
      }).start();
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(swing, { toValue: 1, duration: SWING_MS / 2, easing: SWING_EASING, useNativeDriver: true }),
        Animated.timing(swing, { toValue: 0, duration: SWING_MS / 2, easing: SWING_EASING, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const rotate = swing.interpolate({ inputRange: [0, 1], outputRange: [`-${SWING_DEG}deg`, `${SWING_DEG}deg`] });

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: SPLASH_BACKGROUND }}>
      <Animated.View
        accessibilityRole="image"
        accessibilityLabel="Sub1S"
        style={{
          width: LOGO_SIZE,
          height: LOGO_SIZE,
          borderRadius: LOGO_RADIUS,
          overflow: "hidden",
          opacity: progress,
          transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [START_SCALE, 1] }) }],
        }}
      >
        <View style={{ position: "absolute", top: 0, left: 0, width: LOGO_SIZE, height: LOGO_SIZE, transform: [{ scale: ART_SCALE }] }}>
          <Animated.Image source={LOGO_BASE} style={{ width: LOGO_SIZE, height: LOGO_SIZE }} />
          <Animated.Image
            source={LOGO_GHOST}
            style={{
              position: "absolute",
              left: GHOST.left,
              top: GHOST.top,
              width: GHOST.width,
              height: GHOST.height,
              transformOrigin: SWING_ORIGIN,
              transform: [{ rotate }],
            }}
          />
        </View>
      </Animated.View>
    </View>
  );
}
