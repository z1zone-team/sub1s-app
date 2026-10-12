import React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cn } from "@/lib/cn";

interface ScreenProps {
  children: React.ReactNode;
  /** true면 내용이 길어질 때 스크롤된다 */
  scroll?: boolean;
  /** 하단 탭이 이미 아래 여백을 처리하는 화면에서는 아래쪽 안전 영역을 뺀다 */
  edges?: ("top" | "bottom")[];
  /** 내용 영역에 붙는 클래스(여백, 간격, 정렬) */
  contentClassName?: string;
  /** 바탕을 면(surface) 색으로 깐다. 이탈 화면처럼 흰 카드가 떠 보여야 할 때 */
  surface?: boolean;
}

export function Screen({
  children,
  scroll = false,
  edges = ["top"],
  contentClassName = "",
  surface = false,
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} className={surface ? "flex-1 bg-surface" : "flex-1 bg-bg"}>
      {scroll ? (
        <ScrollView
          contentContainerClassName={cn("pb-6", contentClassName)}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View className={cn("flex-1", contentClassName)}>{children}</View>
      )}
    </SafeAreaView>
  );
}
