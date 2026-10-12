import React from "react";
import Ghost from "@assets/svg/ghost-voice-fail.svg";

/** 음성 인식 실패 화면의 찌푸린 유령. 그림은 `assets/svg/ghost-voice-fail.svg` (프로토타입 VoiceFail.dc.html) */
export function VoiceFailMascot({ size = 120 }: { size?: number }) {
  return <Ghost width={size} height={size} />;
}
