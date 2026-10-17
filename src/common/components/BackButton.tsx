import React from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import { cn } from "@/lib/cn";
import { DesignIcon } from "./DesignIcon";

interface BackButtonProps {
  onPress: () => void;
  /** plain은 배경 없이 아이콘만, floating은 지도 위에 뜨는 테두리 있는 원 */
  variant?: "plain" | "floating";
  /** 아이콘 크기. 화면마다 기존 값을 그대로 쓴다 */
  iconSize?: number;
  strokeWidth?: number;
  /** 위치와 여백(ml-3, absolute left-4 등) */
  className?: string;
  style?: StyleProp<ViewStyle>;
}

/** 화면의 뒤로 가기 버튼. 누르는 영역은 `h-control w-control`로 모든 화면이 같다 */
export function BackButton({
  onPress,
  variant = "plain",
  iconSize,
  strokeWidth,
  className,
  style,
}: BackButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="뒤로"
      onPress={onPress}
      style={style}
      className={cn(
        "h-control w-control items-center justify-center",
        variant === "floating" ? "rounded-pill border border-border bg-bg" : "",
        className
      )}
    >
      <DesignIcon name="back" size={iconSize} strokeWidth={strokeWidth} />
    </Pressable>
  );
}
