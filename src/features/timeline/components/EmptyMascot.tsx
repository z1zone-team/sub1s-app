import React from "react";
import Ghost from "@assets/svg/ghost-empty.svg";

/** 타임라인 기록 없음 화면의 멍한 유령. 그림은 `assets/svg/ghost-empty.svg` (프로토타입 TimelineEmpty.dc.html) */
export function EmptyMascot({ size = 64 }: { size?: number }) {
  return <Ghost width={size} height={size} />;
}
