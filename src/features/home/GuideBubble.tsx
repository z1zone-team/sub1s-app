import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, PanResponder, Pressable, View } from "react-native";
import { DesignIcon } from "@/common/components/DesignIcon";
import { Text } from "@/common/components/Text";
import {
  BUBBLE_SIZE,
  bubbleBounds,
  clampToBounds,
  defaultBubblePosition,
  DRAG_START_DISTANCE,
  END_TARGET_SIZE,
  endDropPosition,
  endTargetCenter,
  endTargetTop,
  isOverEndTarget,
  snapX,
  type Point,
} from "./bubbleGeometry";

type Mode = "idle" | "drag" | "over" | "ending";

const SNAP_MS = 320;
const ENDING_MS = 280;
const SCALE_MS = 200;
const RING_MS = 1600;
const EASING = Easing.bezier(0.22, 0.61, 0.36, 1);

interface GuideBubbleProps {
  /** 버튼이 움직이는 영역의 크기 */
  width: number;
  height: number;
  /** 접힌 시트(또는 장소 카드)의 위쪽 y. 이 위로 버튼이 놓이고 끝내기 원이 뜬다 */
  sheetTop: number;
  /** 버튼이 올라갈 수 있는 가장 위 y */
  topLimit: number;
  /** "31분" */
  label: string;
  onPress: () => void;
  /** 끝내기 원에 놓았을 때 */
  onEnd: () => void;
}

/**
 * 안내 중 홈의 복귀 버튼(68px). 끌어서 옮길 수 있고 놓으면 가까운 쪽 가장자리에 붙는다.
 * 끌면 아래 가운데에 끝내기 원이 떠오르고, 그 위에 놓으면 안내가 끝난다(프로토타입 MainGuiding.dc.html).
 * 탭하면 안내 화면으로 돌아간다
 */
export function GuideBubble({ width, height, sheetTop, topLimit, label, onPress, onEnd }: GuideBubbleProps) {
  const bounds = useMemo(() => bubbleBounds(width, sheetTop, topLimit), [width, sheetTop, topLimit]);
  const target = useMemo(() => endTargetCenter(width, sheetTop), [width, sheetTop]);

  const pos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const current = useRef<Point>({ x: 0, y: 0 });
  const placed = useRef(false);
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const showTarget = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const [mode, setMode] = useState<Mode>("idle");

  // 제스처 콜백은 한 번만 만들어지므로 최신 값은 ref로 읽는다
  const live = useRef({ bounds, target, width, mode, onEnd });
  live.current = { bounds, target, width, mode, onEnd };

  const setModeBoth = (next: Mode) => {
    live.current.mode = next;
    setMode(next);
  };

  // 영역 크기를 알게 되면 처음 자리에 놓고, 이후 크기가 바뀌면 범위 안으로 되돌린다
  useEffect(() => {
    if (width === 0 || height === 0) return;
    const next = placed.current
      ? clampToBounds(current.current, bounds)
      : defaultBubblePosition(bounds, sheetTop);
    placed.current = true;
    current.current = next;
    pos.setValue(next);
  }, [width, height, bounds, sheetTop, pos]);

  // 바깥으로 퍼지며 사라지는 링 (프로토타입의 ring)
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(ring, { toValue: 1, duration: RING_MS, easing: Easing.out(Easing.ease), useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [ring]);

  // 상태에 따라 버튼 크기와 끝내기 원이 바뀐다
  useEffect(() => {
    const toScale = mode === "ending" ? 0.3 : mode === "over" ? 0.85 : mode === "drag" ? 1.08 : 1;
    Animated.timing(scale, { toValue: toScale, duration: SCALE_MS, easing: EASING, useNativeDriver: true }).start();
    Animated.timing(opacity, { toValue: mode === "ending" ? 0 : 1, duration: SCALE_MS, easing: EASING, useNativeDriver: true }).start();
    Animated.timing(showTarget, {
      toValue: mode === "idle" ? 0 : 1,
      duration: SCALE_MS,
      easing: EASING,
      useNativeDriver: true,
    }).start();
  }, [mode, scale, opacity, showTarget]);

  const panResponder = useMemo(() => {
    let start: Point = { x: 0, y: 0 };
    const snap = () => {
      const { bounds: b, width: w } = live.current;
      const x = snapX(current.current.x, w, b);
      const y = Math.max(b.minY, Math.min(b.maxY, current.current.y));
      current.current = { x, y };
      Animated.timing(pos, { toValue: { x, y }, duration: SNAP_MS, easing: EASING, useNativeDriver: false }).start();
      setModeBoth("idle");
    };
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) + Math.abs(gesture.dy) > DRAG_START_DISTANCE,
      onPanResponderGrant: () => {
        pos.stopAnimation();
        start = { ...current.current };
        setModeBoth("drag");
      },
      onPanResponderMove: (_event, gesture) => {
        const next = clampToBounds({ x: start.x + gesture.dx, y: start.y + gesture.dy }, live.current.bounds);
        current.current = next;
        pos.setValue(next);
        const over = isOverEndTarget(next, live.current.target);
        if (over !== (live.current.mode === "over")) setModeBoth(over ? "over" : "drag");
      },
      onPanResponderRelease: () => {
        if (live.current.mode !== "over") {
          snap();
          return;
        }
        // 끝내기 원으로 빨려 들어가며 작아지고 사라진 뒤 안내를 끝낸다
        setModeBoth("ending");
        const drop = endDropPosition(live.current.target);
        current.current = drop;
        Animated.timing(pos, { toValue: drop, duration: ENDING_MS, easing: EASING, useNativeDriver: false }).start(() =>
          live.current.onEnd()
        );
      },
      onPanResponderTerminate: () => {
        if (live.current.mode === "ending") return;
        snap();
      },
    });
  }, [pos]);

  if (width === 0 || height === 0) return null;

  const over = mode === "over" || mode === "ending";
  return (
    <>
      <Animated.View
        pointerEvents="none"
        className="absolute inset-x-0 items-center gap-2"
        style={{
          top: endTargetTop(sheetTop),
          opacity: showTarget,
          transform: [{ translateY: showTarget.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        }}
      >
        <View
          className="items-center justify-center rounded-pill"
          style={{
            width: END_TARGET_SIZE,
            height: END_TARGET_SIZE,
            backgroundColor: over ? "#F04452" : "rgba(25,31,40,0.72)",
            transform: [{ scale: over ? 1.18 : 1 }],
            elevation: 6,
          }}
        >
          <DesignIcon name="close" size={26} tone="onPrimary" strokeWidth={2.4} />
        </View>
        <View className="h-6.5 justify-center rounded-pill px-2.5" style={{ backgroundColor: "rgba(25,31,40,0.72)" }}>
          <Text className="text-small font-sans-semibold text-on-primary">
            {over ? "놓으면 안내를 끝내요" : "여기로 끌어서 안내 끝내기"}
          </Text>
        </View>
      </Animated.View>

      <Animated.View
        {...panResponder.panHandlers}
        style={{ position: "absolute", left: pos.x, top: pos.y, width: BUBBLE_SIZE, height: BUBBLE_SIZE }}
      >
        <Animated.View style={{ flex: 1, opacity, transform: [{ scale }] }}>
          <Animated.View
            className="absolute inset-0 rounded-pill bg-primary"
            style={{
              opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
              transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }],
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`안내 화면으로 돌아가기, ${label} 남음. 끌어서 옮길 수 있어요`}
            onPress={onPress}
            className="absolute inset-0 items-center justify-center gap-px rounded-pill border-[3px] border-bg bg-primary"
            style={{ elevation: mode === "idle" ? 3 : 8 }}
          >
            <DesignIcon name="train" size={22} tone="onPrimary" />
            <Text className="text-small font-sans-bold text-on-primary">{label}</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </>
  );
}
