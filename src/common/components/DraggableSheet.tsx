import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";
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
/** 손잡이 누름 영역의 높이(px). 손가락으로 잡기 쉽게 넉넉하다 */
const HANDLE_TOUCH_HEIGHT = 56;
/** 누름 영역에서 아래쪽이 제목 줄과 겹치는 높이(px) */
const HANDLE_OVERLAP = 20;
/** 손잡이 영역에서 보이는 높이 */
const HANDLE_VISIBLE_HEIGHT = HANDLE_TOUCH_HEIGHT - HANDLE_OVERLAP;
/** 전체 단계에서는 내용이 위까지 올라오도록 손잡이 영역을 낮춘다 */
const HANDLE_TOUCH_HEIGHT_FULL = 36;
const HANDLE_OVERLAP_FULL = 12;
/** 전체 단계에서 손잡이 영역이 차지하는 높이(px). 그 아래에서 내용이 시작한다 */
export const SHEET_FULL_HANDLE_HEIGHT = HANDLE_TOUCH_HEIGHT_FULL - HANDLE_OVERLAP_FULL;

interface DraggableSheetProps {
  /** 중간 위치에서도 보이는 윗부분(제목 줄 등). 손잡이 아래에 놓인다 */
  header?: React.ReactNode;
  /** 위 위치에서만 보이는 내용 */
  children?: React.ReactNode;
  /** 처음 위치. 기본은 위(디폴트) */
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
  /**
   * 위(디폴트) 위치에서 시트의 높이(px). 없으면 내용 높이다.
   * `expandable`이면 디폴트에서 화면에 보이는 높이다
   */
  height?: number;
  /** 위 위치에서 시트의 최대 높이(px). height가 없고 scrollable일 때, 내용이 더 길면 시트 안에서 스크롤된다 */
  maxHeight?: number;
  /** true면 내용이 시트 안에서 스크롤된다. height나 maxHeight와 함께 쓴다 */
  scrollable?: boolean;
  /**
   * true면 전체 단계가 생긴다. 시트를 끝까지 올리면 지도를 덮는 화면 높이까지 올라오고,
   * 위(디폴트)는 `height`나 내용 높이만큼만 보인다. 시트는 이 시트가 놓인 영역 전체를 기준으로 한다
   */
  expandable?: boolean;
  /** 전체 단계에서 시트 위쪽에 비워 둘 높이(px). 시트 위에 보이는 뒤로가기 버튼이나 배너가 내용을 가리지 않게 한다 */
  fullTopInset?: number;
  /**
   * true면 제목 줄(header)이 내용과 함께 스크롤되고, 디폴트에서도 내용을 위로 끌면 시트가 아니라 내용이 스크롤된다.
   * 시트는 손잡이를 끌거나 눌러서 올린다. scrollable과 함께 쓴다
   */
  contentFirst?: boolean;
  /** true면 중간(축소) 위치를 없애고 위와 아래만 둔다 */
  skipMiddle?: boolean;
  /**
   * 내용 맨 아래에 이어 붙는 영역(행동 버튼 등). 전체 단계에서는 내용에서 떨어져 시트 맨 아래에 고정되고
   * 위에는 children만 남는다. 아래 고정 영역(bottomInset)만큼 아래를 비운다
   */
  bottomDock?: React.ReactNode;
  /** 이 시트를 코드로 움직이는 손잡이를 받는다(예: 칸을 눌러 지도를 보여 줄 때 시트를 내린다) */
  controlRef?: React.MutableRefObject<DraggableSheetHandle | null>;
  /**
   * 시트가 올라온 정도를 0(디폴트)에서 1(전체)로 알려 주는 값을 받는다. 끌거나 애니메이션이 도는 동안 계속 바뀌므로,
   * 위의 배너처럼 전체와 함께 바뀌는 것을 시트와 같은 속도로 바꾸는 데 쓴다. expandable일 때만 의미가 있다
   */
  onFullProgress?: (progress: Animated.AnimatedInterpolation<number>) => void;
  /** 시트 안쪽 좌우 여백 클래스 */
  className?: string;
  /** 시트 바로 위에 붙어 시트와 함께 움직이는 것(하차 알림 등) */
  above?: React.ReactNode;
  /** 손잡이의 접근성 이름. "OO 접기"나 "OO 펼치기"가 된다 */
  label: string;
  /** 지금 지도에서 시트가 차지하는 높이(px). 위치가 바뀌거나 크기가 달라질 때 알린다 */
  onVisibleHeightChange?: (height: number) => void;
  /** 시트가 다른 단계에 자리 잡을 때 알린다. 전체일 때 위의 배너를 바꾸는 데 쓴다 */
  onPositionChange?: (position: SheetPosition) => void;
}

/**
 * 지도 위에 얹는 바텀시트. 전체, 위(디폴트), 중간, 아래 네 위치가 있고 시트 어디를 끌어도 오르내린다.
 * 전체는 지도를 덮고(expandable일 때만), 위는 내용, 중간은 제목 줄만, 아래는 손잡이만 남아 지도가 크게 보인다.
 * 빠르게 쓸면 한 칸, 천천히 끌면 가장 가까운 위치에 자리 잡고, 손잡이를 누르면 한 칸씩 오르내린다.
 * 위에서 아래로 끌 때 내용이 스크롤 중이면 스크롤이 우선이다
 */
/** 시트를 코드로 움직일 때 쓰는 손잡이. controlRef로 받는다 */
export interface DraggableSheetHandle {
  snapTo: (position: SheetPosition) => void;
}

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
  expandable = false,
  fullTopInset = 0,
  contentFirst = false,
  skipMiddle = false,
  bottomDock,
  controlRef,
  onFullProgress,
  className,
  above,
  label,
  onVisibleHeightChange,
  onPositionChange,
}: DraggableSheetProps) {
  const [position, setPosition] = useState<SheetPosition>(initial);
  const [bodyHeight, setBodyHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [areaHeight, setAreaHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const measured = !expandable || areaHeight > 0;
  // 전체 단계가 있으면 시트는 영역 전체 높이이고, 디폴트에서는 그 아래쪽을 화면 밖으로 내려 둔다
  const sheetHeight = expandable ? areaHeight : (height ?? bodyHeight);
  // 디폴트에서 보이는 높이: 지정한 높이, 없으면 내용 높이(손잡이 포함)에 아래 고정 영역을 더한 값이다
  const naturalVisible = (contentFirst ? HANDLE_VISIBLE_HEIGHT + contentHeight : contentHeight) + bottomInset;
  const topVisible = expandable
    ? Math.min(height ?? naturalVisible, Math.max(0, areaHeight - fullTopInset))
    : undefined;
  const headBlockHeight = contentFirst ? HANDLE_VISIBLE_HEIGHT + headerHeight : headerHeight;
  const bottomVisible = HANDLE_VISIBLE_HEIGHT + bottomInset;
  const middleVisible = skipMiddle ? bottomVisible : (middleHeight ?? headBlockHeight) + bottomInset;
  const offsets = useMemo(
    () => sheetOffsets(sheetHeight, middleVisible, bottomVisible, topVisible),
    [sheetHeight, middleVisible, bottomVisible, topVisible]
  );

  const offset = useRef(new Animated.Value(offsets[initial])).current;
  // 제스처 콜백은 한 번만 만들어지므로 최신 값은 ref로 읽는다
  const live = useRef({ position, offsets, startOffset: 0, scrollY: 0 });
  live.current.position = position;
  live.current.offsets = offsets;

  const report = useCallback(
    (next: SheetPosition, current: SheetOffsets) =>
      // 전체로 올려 지도를 가려도 지도에는 디폴트까지만 알린다(지도가 가려진 동안 다시 맞추지 않게)
      onVisibleHeightChange?.(Math.max(0, sheetHeight - Math.max(current[next], current.TOP))),
    [onVisibleHeightChange, sheetHeight]
  );

  const snapTo = useCallback(
    (next: SheetPosition) => {
      setPosition(next);
      onPositionChange?.(next);
      report(next, live.current.offsets);
      // 접히면 제목 줄이 보이도록 내용을 맨 위로 되돌린다
      if (next === "MIDDLE" || next === "BOTTOM") scrollRef.current?.scrollTo({ y: 0, animated: false });
      Animated.timing(offset, {
        toValue: live.current.offsets[next],
        duration: ANIMATION_MS,
        easing: SHEET_EASING,
        useNativeDriver: false,
      }).start();
    },
    [offset, report, onPositionChange]
  );

  useEffect(() => {
    if (!controlRef) return undefined;
    controlRef.current = { snapTo };
    return () => {
      controlRef.current = null;
    };
  }, [controlRef, snapTo]);

  // 크기가 바뀌면(내용이 늘거나 줄거나 화면이 바뀌면) 지금 위치로 애니메이션 없이 맞춘다
  useEffect(() => {
    offset.setValue(offsets[live.current.position]);
    report(live.current.position, offsets);
  }, [offset, offsets, report]);

  const makeResponder = useCallback(
    (fromHandle: boolean) => {
      const wantsDrag = (_event: unknown, gesture: { dx: number; dy: number }) =>
        shouldCaptureDrag({
          dx: gesture.dx,
          dy: gesture.dy,
          position: live.current.position,
          offsets: live.current.offsets,
          scrollAtTop: live.current.scrollY <= 0,
          contentFirst,
          fromHandle,
        });
      return PanResponder.create({
        ...(fromHandle
          ? { onMoveShouldSetPanResponder: wantsDrag }
          : { onMoveShouldSetPanResponderCapture: wantsDrag }),
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
          snapTo(
            positionAfterRelease({
              from,
              dy: gesture.dy,
              vy: gesture.vy,
              offsets: live.current.offsets,
            })
          );
        },
        onPanResponderTerminate: () => snapTo(live.current.position),
      });
    },
    [offset, snapTo, contentFirst]
  );
  const panResponder = useMemo(() => makeResponder(false), [makeResponder]);
  const handleResponder = useMemo(() => makeResponder(true), [makeResponder]);

  const onBodyLayout = (event: LayoutChangeEvent) => setBodyHeight(Math.round(event.nativeEvent.layout.height));
  const onHeaderLayout = (event: LayoutChangeEvent) => setHeaderHeight(Math.round(event.nativeEvent.layout.height));

  // 시트가 올라온 정도(디폴트 0, 전체 1). 끄는 동안 계속 바뀌므로 이 값으로 바뀌는 것들은 시트와 같은 속도로 변한다
  const fullProgress = useMemo(
    () =>
      offset.interpolate({
        inputRange: [0, Math.max(1, offsets.TOP)],
        outputRange: [1, 0],
        extrapolate: "clamp",
      }),
    [offset, offsets.TOP]
  );
  useEffect(() => {
    onFullProgress?.(fullProgress);
  }, [fullProgress, onFullProgress]);

  const next = positionAfterTap(position, offsets);
  const handleButton = (flexFill: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={offsets[next] < offsets[position] ? `${label} 펼치기` : `${label} 접기`}
      accessibilityState={{
        expanded: position === "TOP" || position === "FULL",
      }}
      onPress={() => snapTo(positionAfterTap(live.current.position, live.current.offsets))}
      style={flexFill ? undefined : { height: HANDLE_TOUCH_HEIGHT, marginBottom: -HANDLE_OVERLAP }}
      className={flexFill ? "flex-1 items-center justify-center" : "items-center justify-center"}
    >
      <View className="h-1.5 w-12 rounded-pill bg-border" />
    </Pressable>
  );
  // 내용이 먼저 스크롤되는 시트는 전체에서 내용이 위까지 올라오도록 손잡이 영역도 시트와 함께 낮아진다
  const handle =
    contentFirst && expandable ? (
      <Animated.View
        style={{
          height: fullProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [HANDLE_TOUCH_HEIGHT, HANDLE_TOUCH_HEIGHT_FULL],
          }),
          marginBottom: fullProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [-HANDLE_OVERLAP, -HANDLE_OVERLAP_FULL],
          }),
        }}
      >
        {handleButton(true)}
      </Animated.View>
    ) : (
      handleButton(false)
    );

  // 전체에서는 시트가 화면 맨 위까지 올라오므로, 위에 겹쳐 보이는 것(뒤로가기 등) 아래로 내용을 내린다
  const topPadding =
    expandable && fullTopInset > 0
      ? offset.interpolate({
          inputRange: [0, fullTopInset],
          outputRange: [fullTopInset, 0],
          extrapolate: "clamp",
        })
      : 0;
  const scrollEnabled = position === "TOP" || position === "FULL";

  const body = (
    <Animated.View
      {...panResponder.panHandlers}
      onLayout={onBodyLayout}
      style={[
        expandable
          ? { height: areaHeight, paddingTop: topPadding }
          : height !== undefined
            ? { height }
            : maxHeight !== undefined
              ? { maxHeight }
              : undefined,
      ]}
      className="rounded-t-xl border-t border-border bg-bg"
    >
      {/* 전체에서는 시트가 화면 맨 위에 닿아 위에 붙일 자리가 없으므로 시트 안쪽 맨 위에 둔다 */}
      {above && position === "FULL" ? <View pointerEvents="box-none">{above}</View> : null}
      {contentFirst ? (
        <>
          <View {...handleResponder.panHandlers}>{handle}</View>
          <ScrollView
            ref={scrollRef}
            scrollEnabled={scrollEnabled}
            onScroll={(event) => {
              live.current.scrollY = event.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
            className="flex-1"
            // 디폴트에서는 시트 아래쪽이 화면 밖이라, 그만큼 비워 두어야 내용 끝까지 스크롤된다
            contentContainerStyle={{
              paddingBottom: 8 + (expandable ? offsets.TOP : 0),
            }}
            contentContainerClassName={className}
          >
            <View onLayout={(event) => setContentHeight(Math.round(event.nativeEvent.layout.height))}>
              <View onLayout={onHeaderLayout}>{header}</View>
              {children}
              {/* 전체로 올라가는 만큼 이 자리의 영역은 흐려지고, 아래에 고정된 같은 영역이 짙어진다 */}
              {bottomDock ? (
                <Animated.View
                  pointerEvents={position === "FULL" ? "none" : "auto"}
                  style={{
                    opacity: fullProgress.interpolate({
                      inputRange: [0, 0.5],
                      outputRange: [1, 0],
                      extrapolate: "clamp",
                    }),
                  }}
                >
                  <View style={{ paddingBottom: bottomInset }}>{bottomDock}</View>
                </Animated.View>
              ) : null}
            </View>
          </ScrollView>
          {bottomDock ? (
            <Animated.View
              pointerEvents={position === "FULL" ? "auto" : "none"}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                opacity: fullProgress.interpolate({
                  inputRange: [0.5, 1],
                  outputRange: [0, 1],
                  extrapolate: "clamp",
                }),
              }}
              className={className}
            >
              <View style={{ paddingBottom: bottomInset }}>{bottomDock}</View>
            </Animated.View>
          ) : null}
        </>
      ) : (
        <View
          // 내용을 스크롤하는 시트는 남은 높이를 스크롤이 채워야 하고, 아니면 내용 높이를 재서 디폴트 높이로 쓴다
          className={scrollable && (height !== undefined || expandable) ? "flex-1" : undefined}
          onLayout={
            expandable && !scrollable
              ? (event) => setContentHeight(Math.round(event.nativeEvent.layout.height))
              : undefined
          }
        >
          <View onLayout={onHeaderLayout} className={className}>
            {handle}
            {header}
          </View>
          {scrollable ? (
            <ScrollView
              ref={scrollRef}
              scrollEnabled={scrollEnabled}
              onScroll={(event) => {
                live.current.scrollY = event.nativeEvent.contentOffset.y;
              }}
              scrollEventThrottle={16}
              keyboardShouldPersistTaps="handled"
              className={height === undefined && !expandable ? undefined : "flex-1"}
              contentContainerStyle={expandable ? { paddingBottom: offsets.TOP } : undefined}
              contentContainerClassName={cn("pb-2", className)}
            >
              {children}
            </ScrollView>
          ) : (
            <View className={className}>{children}</View>
          )}
        </View>
      )}
    </Animated.View>
  );

  const sheet = (
    <Animated.View
      style={{ transform: [{ translateY: offset }], opacity: measured ? 1 : 0 }}
      className="absolute inset-x-0 bottom-0"
    >
      {above && position !== "FULL" ? (
        <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom: "100%" }}>
          {above}
        </View>
      ) : null}
      {body}
    </Animated.View>
  );

  return (
    <>
      {expandable ? (
        <View
          pointerEvents="box-none"
          style={StyleSheet.absoluteFill}
          onLayout={(event) => setAreaHeight(Math.round(event.nativeEvent.layout.height))}
        >
          {sheet}
        </View>
      ) : (
        sheet
      )}
      {coverBottom && bottomInset > 0 ? (
        <View pointerEvents="none" style={{ height: bottomInset }} className="absolute inset-x-0 bottom-0 bg-bg" />
      ) : null}
    </>
  );
}
