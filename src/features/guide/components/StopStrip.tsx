import React, { useEffect, useRef } from "react";
import { ScrollView, View } from "react-native";
import { Text } from "@/common/components/Text";
import { cn } from "@/lib/cn";

interface StopStripProps {
  names: string[];
  currentIndex: number;
}

const ITEM_WIDTH = 72;

/** 지나온 역은 흐리게, 지금 역은 진하게 보여 주는 가로 역 목록 */
export function StopStrip({ names, currentIndex }: StopStripProps) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ x: Math.max(0, (currentIndex - 1) * ITEM_WIDTH), animated: true });
  }, [currentIndex]);

  return (
    <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false}>
      {names.map((name, index) => {
        const passed = index < currentIndex;
        const current = index === currentIndex;
        const reached = passed || current;
        return (
          <View key={`${index}-${name}`} style={{ width: ITEM_WIDTH }} className="items-center gap-1.5">
            <View className="w-full flex-row items-center">
              <View
                className={cn("h-0.75 flex-1", index === 0 ? "bg-transparent" : reached ? "bg-primary" : "bg-border")}
              />
              <View
                className={cn("rounded-pill border-2", current ? "h-4 w-4" : "h-2.5 w-2.5", reached ? "border-primary bg-primary" : "border-border bg-bg")}
              />
              <View
                className={cn("h-0.75 flex-1", index === names.length - 1 ? "bg-transparent" : passed ? "bg-primary" : "bg-border")}
              />
            </View>
            <Text
              numberOfLines={1}
              className={cn("text-small", current ? "font-sans-extrabold" : "font-sans-medium", passed ? "text-text-secondary" : "text-text")}
            >
              {name}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}
