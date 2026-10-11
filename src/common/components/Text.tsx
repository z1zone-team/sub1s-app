import React from "react";
import { Text as RNText, type TextProps } from "react-native";
import { cn } from "@/lib/cn";

/** 글꼴(Pretendard)과 글자색 토큰을 기본으로 가진 텍스트. 굵기는 font-sans-bold처럼 글꼴 이름으로 고른다 */
export function Text({ className, ...props }: TextProps & { className?: string }) {
  return <RNText className={cn("font-sans text-text", className)} {...props} />;
}
