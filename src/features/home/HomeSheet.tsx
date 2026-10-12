import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, PanResponder, Pressable, ScrollView, View } from "react-native";
import { Text } from "@/common/components/Text";

/** 접힌 시트가 탭바 위로 보이는 높이 (프로토타입 200px) */
export const SHEET_PEEK_HEIGHT = 200;
/** 이만큼 끌면 방향대로 열리거나 닫힌다 */
const SNAP_DISTANCE = 40;
const DRAG_START_DISTANCE = 5;
const ANIMATION_MS = 320;
/** 프로토타입의 cubic-bezier(.2, .8, .2, 1) */
const SHEET_EASING = Easing.bezier(0.2, 0.8, 0.2, 1);

interface HomeSheetProps {
  /** 시트가 놓이는 영역의 높이. 접힌 위치를 계산한다 */
  containerHeight: number;
  /** 펼쳤을 때 위에 남기는 여백 (상태 표시줄) */
  topInset: number;
  title: string;
  actionLabel: string;
  onActionPress: () => void;
  children: React.ReactNode;
}

/** 손잡이를 끌어 올리면 전체 화면 가까이 펼쳐지는 바텀시트. 접힌 상태에서는 목록이 스크롤되지 않는다 */
export function HomeSheet({
  containerHeight,
  topInset,
  title,
  actionLabel,
  onActionPress,
  children,
}: HomeSheetProps) {
  const [open, setOpen] = useState(false);
  const closedTop = Math.max(containerHeight - SHEET_PEEK_HEIGHT, topInset);
  const openTop = topInset;
  const top = useRef(new Animated.Value(closedTop)).current;

  // 제스처 콜백은 한 번만 만들어지므로 최신 값은 ref로 읽는다
  const state = useRef({ open, openTop, closedTop, startTop: closedTop });
  state.current.open = open;
  state.current.openTop = openTop;
  state.current.closedTop = closedTop;

  const snapTo = useCallback(
    (next: boolean) => {
      setOpen(next);
      Animated.timing(top, {
        toValue: next ? state.current.openTop : state.current.closedTop,
        duration: ANIMATION_MS,
        easing: SHEET_EASING,
        useNativeDriver: false,
      }).start();
    },
    [top]
  );

  // 화면 크기나 안전 영역이 바뀌면 애니메이션 없이 현재 상태의 위치로 맞춘다
  useEffect(() => {
    top.setValue(state.current.open ? openTop : closedTop);
  }, [top, openTop, closedTop]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > DRAG_START_DISTANCE,
        onPanResponderGrant: () => {
          top.stopAnimation((value) => {
            state.current.startTop = value;
          });
        },
        onPanResponderMove: (_event, gesture) => {
          const { openTop: min, closedTop: max, startTop } = state.current;
          top.setValue(Math.max(min, Math.min(max, startTop + gesture.dy)));
        },
        onPanResponderRelease: (_event, gesture) => {
          const { openTop: min, closedTop: max, startTop } = state.current;
          const current = Math.max(min, Math.min(max, startTop + gesture.dy));
          const willOpen =
            gesture.dy < -SNAP_DISTANCE ? true : gesture.dy > SNAP_DISTANCE ? false : current < (min + max) / 2;
          snapTo(willOpen);
        },
        onPanResponderTerminate: () => snapTo(state.current.open),
      }),
    [top, snapTo]
  );

  return (
    <Animated.View
      style={{ top }}
      className="absolute inset-x-0 bottom-0 rounded-t-xl border-t border-border bg-bg"
    >
      <View {...panResponder.panHandlers} className="px-6">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={open ? `${title} 접기` : `${title} 펼치기`}
          accessibilityState={{ expanded: open }}
          onPress={() => snapTo(!open)}
          className="-mb-3.5 h-11 items-center justify-center"
        >
          <View className="h-1 w-9 rounded-pill bg-border" />
        </Pressable>
        <View className="mb-1.5 h-control flex-row items-center justify-between">
          <Text className="text-title font-sans-bold">{title}</Text>
          <Pressable accessibilityRole="button" onPress={onActionPress} className="min-h-control justify-center">
            <Text className="text-body-sm font-sans-semibold text-accent">{actionLabel}</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView scrollEnabled={open} keyboardShouldPersistTaps="handled" contentContainerClassName="px-6 pb-2">
        {children}
      </ScrollView>
    </Animated.View>
  );
}
