import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

const INK = "#191F28";
const MUTED = "#B0B8C1";

/** 기록 없음 화면의 캐릭터(멍한 눈, 동그란 입, 회색 선). 프로토타입 TimelineEmpty.dc.html의 SVG 경로 그대로 */
export function EmptyMascot({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <Path
        d="M12 46V28a18 18 0 0 1 36 0v16C48 47 49.5 49 52 50.5C53.5 51.5 52.5 53.5 50 53.5C47.5 53.5 46.5 51.5 44.5 51.8C42.5 52.1 42 55 39 55C36 55 35.5 52.2 33 52.4C30.5 52.6 30 55.5 26.8 55.5C23.6 55.5 23.2 52.6 20.8 52.6C18 52.6 16.5 54 14.6 53C12.6 52 12 49.5 12 46z"
        fill="#FFFFFF"
        stroke={INK}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="M21.5 29h5M33.5 29h5" stroke={INK} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={30} cy={38} r={2} stroke={INK} strokeWidth={1.8} />
      <Path d="M46 14l3-3M50 18h4M44 10V6" stroke={MUTED} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}
