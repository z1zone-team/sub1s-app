import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, PanResponder, Pressable, ScrollView, View, type LayoutChangeEvent } from "react-native";
import { cn } from "@/lib/cn";
import {
  nearestPosition,
  positionAfterRelease,
  positionAfterTap,
  sheetOffsets,
  shouldCaptureDrag,
  type SheetOffsets,
  type SheetPosition,
} from "./sheetGesture";

const ANIMATION_MS = 320;
/** 프로토타입의 cubic-bezier(.2, .8, .2, 1) */
const SHEET_EASING = Easing.bezier(0.2, 0.8, 0.2, 1);
/** 손잡이 영역에서 보이는 높이. 손잡이 누름 영역(44px)에서 아래 14px는 제목 줄과 겹친다 */
const HANDLE_VISIBLE_HEIGHT = 30;

interface DraggableSheetProps {
  /** 중간 위치에서도 보이는 윗부분(제목 줄 등). 손잡이 아래에 놓인다 */
  header?: React.ReactNode;
  /** 위 위치에서만 보이는 내용 */
  children?: React.ReactNode;
  /** 처음 위치. 기본은 위(펼침) */
  initial?: SheetPosition;
  /** 중간 위치에서 보이는 높이(px). 없으면 손잡이와 header의 높이다 */
  middleHeight?: number;
  /**
   * 화면 맨 아래를 항상 덮는 영역의 높이(px). 아래 안전 영역이나 화면 아래에 고정된 버튼 줄이다.
   * 중간과 아래 위치에서 이만큼 더 위로 올라와 보이므로, 이 영역이 시트 내용을 가려야 한다(coverBottom)
   */
  bottomInset?: number;
  /** true면 bottomInset만큼을 시트와 같은 배경으로 덮는다. 고정 버튼 줄이 이미 덮고 있으면 쓰지 않는다 */
  coverBottom?: boolean;
  /** 위 위치에서 시트의 높이(px). 없으면 내용 높이다 */
  height?: number;
  /** 위 위치에서 시트의 최대 높이(px). height가 없고 scrollable일 때, 내용이 더 길면 시트 안에서 스크롤된다 */
  maxHeight?: number;
  /** true면 내용이 시트 안에서 스크롤된다. height나 maxHeight와 함께 쓴다 */
  scrollable?: boolean;
  /** 시트 안쪽 좌우 여백 클래스 */
  className?: string;
  /** 시트 바로 위에 붙어 시트와 함께 움직이는 것(하차 알림 등) */
  above?: React.ReactNode;
  /** 손잡이의 접근성 이름. "OO 접기"나 "OO 펼치기"가 된다 */
  label: string;
  /** 지금 지도에서 시트가 차지하는 높이(px). 위치가 바뀌거나 크기가 달라질 때 알린다 */
  onVisibleHeightChange?: (height: number) => void;
}

/**
 * 지도 위에 얹는 바텀시트. 위, 중간, 아래 세 위치가 있고 시트 어디를 끌어도 오르내린다.
 * 위는 내용 전체, 중간은 제목 줄만, 아래는 손잡이만 남아 지도가 크게 보인다.
 * 빠르게 쓸면 한 칸, 천천히 끌면 가장 가까운 위치에 자리 잡고, 손잡이를 누르면 한 칸씩 오르내린다.
 * 위에서 아래로 끌 때 내용이 스크롤 중이면 스크롤이 우선이다
 */
export function DraggableSheet({
  header,
  children,
  initial = "TOP",
  middleHeight,
  bottomInset = 0,
  coverBottom = false,
  height,
  maxHeight,
  scrollable = false,
  className,
  above,
  label,
  onVisibleHeightChange,
}: DraggableSheetProps) {
  const [position, setPosition] = useState<SheetPosition>(initial);
  const [bodyHeight, setBodyHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);

  const sheetHeight = height ?? bodyHeight;
  const offsets = useMemo(
    () => sheetOffsets(sheetHeight, (middleHeight ?? headerHeight) + bottomInset, HANDLE_VISIBLE_HEIGHT + bottomInset),
    [sheetHeight, middleHeight, headerHeight, bottomInset]
  );

  const offset = useRef(new Animated.Value(offsets[initial])).current;
  // 제스처 콜백은 한 번만 만들어지므로 최신 값은 ref로 읽는다
  const live = useRef({ position, offsets, startOffset: 0, scrollY: 0 });
  live.current.position = position;
  live.current.offsets = offsets;

  const report = useCallback(
    (next: SheetPosition, current: SheetOffsets) =>
      onVisibleHeightChange?.(Math.max(0, sheetHeight - current[next])),
    [onVisibleHeightChange, sheetHeight]
  );

  const snapTo = useCallback(
    (next: SheetPosition) => {
      setPosition(next);
      report(next, live.current.offsets);
      Animated.timing(offset, {
        toValue: live.current.offsets[next],
        duration: ANIMATION_MS,
        easing: SHEET_EASING,
        useNativeDriver: false,
      }).start();
    },
    [offset, report]
  );

  // 크기가 바뀌면(내용이 늘거나 줄거나 화면이 바뀌면) 지금 위치로 애니메이션 없이 맞춘다
  useEffect(() => {
    offset.setValue(offsets[live.current.position]);
    report(live.current.position, offsets);
  }, [offset, offsets, report]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_event, gesture) =>
          shouldCaptureDrag({
            dx: gesture.dx,
            dy: gesture.dy,
            position: live.current.position,
            offsets: live.current.offsets,
            scrollAtTop: live.current.scrollY <= 0,
          }),
        onPanResponderGrant: () => {
          offset.stopAnimation((value) => {
            live.current.startOffset = value;
          });
        },
        onPanResponderMove: (_event, gesture) => {
          const bottom = live.current.offsets.BOTTOM;
          offset.setValue(Math.max(0, Math.min(bottom, live.current.startOffset + gesture.dy)));
        },
        onPanResponderRelease: (_event, gesture) => {
          const from = nearestPosition(live.current.startOffset, live.current.offsets);
          snapTo(positionAfterRelease({ from, dy: gesture.dy, vy: gesture.vy, offsets: live.current.offsets }));
        },
        onPanResponderTerminate: () => snapTo(live.current.position),
      }),
    [offset, snapTo]
  );

  const onBodyLayout = (event: LayoutChangeEvent) => setBodyHeight(Math.round(event.nativeEvent.layout.height));

  return (
    <>
      <Animated.View style={{ transform: [{ translateY: offset }] }} className="absolute inset-x-0 bottom-0">
        {above ? (
          <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom: "100%" }}>
            {above}
          </View>
        ) : null}
        <View
          {...panResponder.panHandlers}
          onLayout={onBodyLayout}
          style={height !== undefined ? { height } : maxHeight !== undefined ? { maxHeight } : undefined}
          className="rounded-t-xl border-t border-border bg-bg"
        >
          <View onLayout={(event) => setHeaderHeight(Math.round(event.nativeEvent.layout.height))} className={className}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={position === "TOP" ? `${label} 접기` : `${label} 펼치기`}
              accessibilityState={{ expanded: position === "TOP" }}
              onPress={() => snapTo(positionAfterTap(live.current.position, live.current.offsets))}
              className="-mb-3.5 h-11 items-center justify-center"
            >
              <View className="h-1 w-9 rounded-pill bg-border" />
            </Pressable>
            {header}
          </View>
          {scrollable ? (
            <ScrollView
              scrollEnabled={position === "TOP"}
              onScroll={(event) => {
                live.current.scrollY = event.nativeEvent.contentOffset.y;
              }}
              scrollEventThrottle={16}
              keyboardShouldPersistTaps="handled"
              className={height === undefined ? undefined : "flex-1"}
              contentContainerClassName={cn("pb-2", className)}
            >
              {children}
            </ScrollView>
          ) : (
            <View className={className}>{children}</View>
          )}
        </View>
      </Animated.View>
      {coverBottom && bottomInset > 0 ? (
        <View pointerEvents="none" style={{ height: bottomInset }} className="absolute inset-x-0 bottom-0 bg-bg" />
      ) : null}
    </>
  );
}
