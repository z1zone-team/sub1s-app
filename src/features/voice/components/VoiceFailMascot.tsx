import React from "react";
import Svg, { Path } from "react-native-svg";

const INK = "#111827";
const MUTED = "#4B5563";

/**
 * 음성 인식 실패 화면의 캐릭터. 찌푸린 눈과 입, 물음표가 붙는다.
 * 프로토타입 VoiceFail.dc.html의 SVG 경로 그대로이고 60 x 60 viewBox를 size로 키운다
 */
export function VoiceFailMascot({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <Path
        d="M12 46V28a18 18 0 0 1 36 0v16C48 47 49.5 49 52 50.5C53.5 51.5 52.5 53.5 50 53.5C47.5 53.5 46.5 51.5 44.5 51.8C42.5 52.1 42 55 39 55C36 55 35.5 52.2 33 52.4C30.5 52.6 30 55.5 26.8 55.5C23.6 55.5 23.2 52.6 20.8 52.6C18 52.6 16.5 54 14.6 53C12.6 52 12 49.5 12 46z"
        fill="#FFFFFF"
        stroke={INK}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M21.5 27.5l5 2.5M38.5 27.5l-5 2.5" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M26 39q4-3 8 0" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M50 14a4 4 0 1 1 4 4v2M54 24v0.5" stroke={MUTED} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}
