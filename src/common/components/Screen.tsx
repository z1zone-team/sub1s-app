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
}

export function Screen({
  children,
  scroll = false,
  edges = ["top"],
  contentClassName = "",
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-bg">
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
