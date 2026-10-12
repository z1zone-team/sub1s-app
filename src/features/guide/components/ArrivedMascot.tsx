import React from "react";
import Svg, { Path } from "react-native-svg";

const OUTLINE = "#002968";
const SPARKLE = "#0072CE";

/**
 * 도착 화면의 기뻐하는 캐릭터. 홈 지도의 내 위치 캐릭터와 같은 몸에 웃는 눈과 입, 반짝이 선이 붙는다.
 * 프로토타입 Arrived.dc.html의 SVG 경로 그대로이고 64 x 64 viewBox를 size로 키운다
 */
export function ArrivedMascot({ size = 112 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M12 46V28a18 18 0 0 1 36 0v16C48 47 49.5 49 52 50.5C53.5 51.5 52.5 53.5 50 53.5C47.5 53.5 46.5 51.5 44.5 51.8C42.5 52.1 42 55 39 55C36 55 35.5 52.2 33 52.4C30.5 52.6 30 55.5 26.8 55.5C23.6 55.5 23.2 52.6 20.8 52.6C18 52.6 16.5 54 14.6 53C12.6 52 12 49.5 12 46z"
        fill="#FFFFFF"
        stroke={OUTLINE}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="M21 29q3-3 6 0M33 29q3-3 6 0" stroke={OUTLINE} strokeWidth={2} strokeLinecap="round" />
      <Path d="M25 36q5 5 10 0" stroke={OUTLINE} strokeWidth={2} strokeLinecap="round" />
      <Path d="M6 18l3 1M8 11l2 3M56 18l-3 1M54 11l-2 3" stroke={SPARKLE} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
