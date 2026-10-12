import React from "react";
import Ghost from "@assets/svg/ghost-arrived.svg";

/** 도착 화면의 기뻐하는 유령. 그림은 `assets/svg/ghost-arrived.svg`이고 size로 키운다 (프로토타입 Arrived.dc.html) */
export function ArrivedMascot({ size = 112 }: { size?: number }) {
  return <Ghost width={size} height={size} />;
}
