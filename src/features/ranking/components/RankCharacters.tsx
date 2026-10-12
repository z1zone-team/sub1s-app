import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

const INK = "#111827";
const MUTED = "#4B5563";
const BODY =
  "M12 46V28a18 18 0 0 1 36 0v16C48 47 49.5 49 52 50.5C53.5 51.5 52.5 53.5 50 53.5C47.5 53.5 46.5 51.5 44.5 51.8C42.5 52.1 42 55 39 55C36 55 35.5 52.2 33 52.4C30.5 52.6 30 55.5 26.8 55.5C23.6 55.5 23.2 52.6 20.8 52.6C18 52.6 16.5 54 14.6 53C12.6 52 12 49.5 12 46z";
const DARK_CIRCLE = "M19.5 31.5q5 4.5 9 0q-4 2.2-9 0zM31.5 31.5q4 4.5 9 0q-5 2.2-9 0z";

interface SizeProps {
  size: number;
}

function Body({ stroke }: { stroke: number }) {
  return <Path d={BODY} fill="#FFFFFF" stroke={INK} strokeWidth={stroke} strokeLinejoin="round" />;
}

/** 1등: 다크서클이 진하고 땀을 흘리는 지친 유령. 프로토타입 Ranking.dc.html의 SVG 경로 그대로 (60 x 60 viewBox) */
export function FirstPlaceCharacter({ size }: SizeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <Body stroke={1.6} />
      <Path d={DARK_CIRCLE} fill="#9CA3AF" />
      <Path d="M20.5 33.5q4 3.5 8 0M31.5 33.5q4 3.5 8 0" stroke={MUTED} strokeWidth={1} strokeLinecap="round" />
      <Path d="M20.5 27h7M32.5 27h7" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M22 27.2a2 2 0 0 0 4 0M34 27.2a2 2 0 0 0 4 0" fill={INK} />
      <Path d="M25 41q1.7-1.6 3.3 0t3.4 0t3.3 0" stroke={INK} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M44 16q2.5 3.5 0 5q-2.5-1.5 0-5z" fill="#FFFFFF" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M48 6h4l-4 4h4M53 1h3l-3 3h3" stroke={MUTED} strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** 2등: 책을 든 유령 */
export function SecondPlaceCharacter({ size }: SizeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <Body stroke={1.6} />
      <Path d="M21.5 27.5q2.5 2 5 0M33.5 27.5q2.5 2 5 0" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M28 33.5h4" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M14 37l16 3 16-3v11l-16 3-16-3z" fill="#FFFFFF" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M30 40v11M18 41l8 1.5M18 44l8 1.5M34 42.5l8-1.5M34 45.5l8-1.5" stroke={INK} strokeWidth={1.1} strokeLinecap="round" />
    </Svg>
  );
}

/** 3등: 이어폰을 낀 유령 */
export function ThirdPlaceCharacter({ size }: SizeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <Body stroke={1.6} />
      <Path d="M21.5 29q2.5-2.5 5 0M33.5 29q2.5-2.5 5 0" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M26.5 35q3.5 3 7 0" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
      <Rect x={9} y={25} width={5} height={8} rx={2.5} fill="#FFFFFF" stroke={INK} strokeWidth={1.6} />
      <Rect x={46} y={25} width={5} height={8} rx={2.5} fill="#FFFFFF" stroke={INK} strokeWidth={1.6} />
      <Path d="M11.5 33q0 9 9 12M48.5 33q0 9-9 12M20.5 45q9.5 3 19 0" stroke={INK} strokeWidth={1.1} strokeLinecap="round" fill="none" />
      <Path d="M52 12v-6l4-1v6M52 12a1.5 1.5 0 1 1-1.5-1.5M56 11a1.5 1.5 0 1 1-1.5-1.5" stroke={MUTED} strokeWidth={1.1} strokeLinecap="round" />
    </Svg>
  );
}

/** 목록 줄의 작은 아바타(24px): 점 눈만 있는 기본 유령 */
export function RowAvatar({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <Body stroke={3} />
      <Circle cx={24} cy={29} r={3} fill={INK} />
      <Circle cx={36} cy={29} r={3} fill={INK} />
    </Svg>
  );
}

export type MoodFaceKey = "NORMAL" | "TIRED" | "DARK_CIRCLES";

/** 표정 카드의 얼굴 3개: 보통(웃는 입), 피곤(반쯤 감은 눈), 다크서클 */
export function MoodFace({ mood, size = 44 }: { mood: MoodFaceKey; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <Body stroke={2} />
      {mood === "NORMAL" ? (
        <>
          <Circle cx={24} cy={29} r={2.6} fill={INK} />
          <Circle cx={36} cy={29} r={2.6} fill={INK} />
          <Path d="M26.5 36q3.5 3 7 0" stroke={INK} strokeWidth={2} strokeLinecap="round" />
        </>
      ) : null}
      {mood === "TIRED" ? (
        <>
          <Path d="M20.5 28h7M32.5 28h7" stroke={INK} strokeWidth={2} strokeLinecap="round" />
          <Path d="M22.5 28.2a1.6 1.6 0 0 0 3.2 0M34.5 28.2a1.6 1.6 0 0 0 3.2 0" fill={INK} />
          <Path d="M27 37.5h6" stroke={INK} strokeWidth={2} strokeLinecap="round" />
        </>
      ) : null}
      {mood === "DARK_CIRCLES" ? (
        <>
          <Path d={DARK_CIRCLE} fill="#9CA3AF" />
          <Path d="M20.5 27h7M32.5 27h7" stroke={INK} strokeWidth={2} strokeLinecap="round" />
          <Path d="M25 40q1.7-1.6 3.3 0t3.4 0t3.3 0" stroke={INK} strokeWidth={2} strokeLinecap="round" />
        </>
      ) : null}
    </Svg>
  );
}

/** 1등 머리 위 왕관(18 x 14) */
export function Crown() {
  return (
    <Svg width={18} height={14} viewBox="0 0 24 18" fill="none" style={{ overflow: "visible" }}>
      <Path d="M3 16L4.5 6l4.5 4 3-6 3 6 4.5-4 1.5 10z" fill="#FFFFFF" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <Circle cx={4.5} cy={5} r={1.6} fill={INK} />
      <Circle cx={12} cy={3} r={1.6} fill={INK} />
      <Circle cx={19.5} cy={5} r={1.6} fill={INK} />
    </Svg>
  );
}
