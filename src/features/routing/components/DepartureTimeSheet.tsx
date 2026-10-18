import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { BottomSheet } from "@/common/components/BottomSheet";
import { Button } from "@/common/components/Button";
import { Text } from "@/common/components/Text";
import { cn } from "@/lib/cn";
import {
  composeDeparture,
  DEPARTURE_MINUTE_STEP,
  departureDays,
  departureText,
  earliestDeparture,
  isSelectableDeparture,
  splitDeparture,
} from "../departureTime";

interface DepartureTimeSheetProps {
  visible: boolean;
  /** 지금 시각(ms). 날짜 후보와 고를 수 있는 가장 이른 시각의 기준이다 */
  nowMs: number;
  /** 지금 고른 출발 시각(ms). 없으면 지금 출발이다 */
  value: number | null;
  onClose: () => void;
  /** 고른 시각(ms). null이면 지금 출발이다 */
  onSelect: (departureMs: number | null) => void;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = Array.from({ length: 60 / DEPARTURE_MINUTE_STEP }, (_, index) => index * DEPARTURE_MINUTE_STEP);

const two = (value: number) => String(value).padStart(2, "0");

function Column({
  values,
  selected,
  onSelect,
  label,
}: {
  values: number[];
  selected: number;
  onSelect: (value: number) => void;
  label: string;
}) {
  const ref = useRef<ScrollView>(null);
  // 열릴 때 고른 값이 가운데쯤 보이게 스크롤한다
  useEffect(() => {
    const index = Math.max(values.indexOf(selected), 0);
    ref.current?.scrollTo({ y: Math.max(0, (index - 2) * ITEM_HEIGHT), animated: false });
    // 값이 바뀔 때마다가 아니라 처음 그려질 때만 맞춘다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScrollView
      ref={ref}
      showsVerticalScrollIndicator={false}
      style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}
      className="flex-1"
      nestedScrollEnabled
    >
      {values.map((value) => {
        const isSelected = value === selected;
        return (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityLabel={`${value}${label}`}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(value)}
            style={{ height: ITEM_HEIGHT }}
            className={cn("items-center justify-center rounded-md", isSelected ? "bg-primary-tint" : "")}
          >
            <Text className={cn("text-title", isSelected ? "font-sans-bold text-primary" : "text-text-secondary")}>
              {two(value)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/**
 * 출발 시각을 고르는 시트. 날짜(오늘부터 7일)와 시, 분(5분 간격)을 고르고, "지금 출발"로 되돌릴 수 있다.
 * 지금보다 이른 시각은 고를 수 없다. 앱 안에서 만든 선택기라 네이티브 모듈이 필요 없다
 */
export function DepartureTimeSheet({ visible, nowMs, value, onClose, onSelect }: DepartureTimeSheetProps) {
  const days = useMemo(() => departureDays(nowMs), [nowMs]);
  const initial = value ?? earliestDeparture(nowMs);
  const start = splitDeparture(initial, days);

  const [dayIndex, setDayIndex] = useState(Math.max(start.dayIndex, 0));
  const [hour, setHour] = useState(start.hour);
  const [minute, setMinute] = useState(start.minute - (start.minute % DEPARTURE_MINUTE_STEP));

  // 열 때마다 지금 고른 값으로 맞춘다
  useEffect(() => {
    if (!visible) return;
    const next = splitDeparture(value ?? earliestDeparture(nowMs), days);
    setDayIndex(Math.max(next.dayIndex, 0));
    setHour(next.hour);
    setMinute(next.minute - (next.minute % DEPARTURE_MINUTE_STEP));
    // 열릴 때만 맞춘다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const chosenMs = composeDeparture(days[dayIndex].startMs, hour, minute);
  const selectable = isSelectableDeparture(chosenMs, nowMs);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text className="text-title-lg font-sans-bold">출발 시각</Text>
      <Text className="mt-1 text-body-sm text-text-secondary">
        {selectable ? departureText(chosenMs, nowMs) : "지금보다 이른 시각은 고를 수 없어요"}
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4" contentContainerClassName="gap-2">
        {days.map((day, index) => (
          <Pressable
            key={day.startMs}
            accessibilityRole="button"
            accessibilityState={{ selected: index === dayIndex }}
            onPress={() => setDayIndex(index)}
            className={cn(
              "h-10 items-center justify-center rounded-pill border px-4",
              index === dayIndex ? "border-primary bg-primary-tint" : "border-border bg-bg"
            )}
          >
            <Text className={cn("text-body", index === dayIndex ? "font-sans-bold text-primary" : "text-text")}>
              {day.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View className="mt-4 flex-row items-center gap-2">
        <Column values={HOURS} selected={hour} onSelect={setHour} label="시" />
        <Text className="text-title font-sans-bold">:</Text>
        <Column values={MINUTES} selected={minute} onSelect={setMinute} label="분" />
      </View>

      <View className="mt-5 flex-row gap-2">
        <Button label="지금 출발" variant="secondary" className="flex-1" onPress={() => onSelect(null)} />
        <Button label="확인" className="flex-1" disabled={!selectable} onPress={() => onSelect(chosenMs)} />
      </View>
    </BottomSheet>
  );
}
