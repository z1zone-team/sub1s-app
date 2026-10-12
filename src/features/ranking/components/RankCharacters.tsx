import React from "react";
import CrownIcon from "@assets/svg/crown.svg";
import FirstGhost from "@assets/svg/ghost-first.svg";
import MoodDark from "@assets/svg/ghost-mood-dark.svg";
import MoodNormal from "@assets/svg/ghost-mood-normal.svg";
import MoodTired from "@assets/svg/ghost-mood-tired.svg";
import RowGhost from "@assets/svg/ghost-row.svg";
import SecondGhost from "@assets/svg/ghost-second.svg";
import ThirdGhost from "@assets/svg/ghost-third.svg";

/** 랭킹 화면의 캐릭터들. 그림은 `assets/svg/` 파일이고 여기서는 크기만 정한다 (프로토타입 Ranking.dc.html) */

interface SizeProps {
  size: number;
}

/** 1등: 다크서클이 진하고 땀을 흘리는 지친 유령 */
export function FirstPlaceCharacter({ size }: SizeProps) {
  return <FirstGhost width={size} height={size} />;
}

/** 2등: 책을 든 유령 */
export function SecondPlaceCharacter({ size }: SizeProps) {
  return <SecondGhost width={size} height={size} />;
}

/** 3등: 이어폰을 낀 유령 */
export function ThirdPlaceCharacter({ size }: SizeProps) {
  return <ThirdGhost width={size} height={size} />;
}

/** 목록 줄의 작은 아바타(24px): 점 눈만 있는 기본 유령 */
export function RowAvatar({ size = 24 }: { size?: number }) {
  return <RowGhost width={size} height={size} />;
}

export type MoodFaceKey = "NORMAL" | "TIRED" | "DARK_CIRCLES";

const MOOD_FACES = { NORMAL: MoodNormal, TIRED: MoodTired, DARK_CIRCLES: MoodDark } as const;

/** 표정 카드의 얼굴 3개: 보통(웃는 입), 피곤(반쯤 감은 눈), 다크서클 */
export function MoodFace({ mood, size = 44 }: { mood: MoodFaceKey; size?: number }) {
  const Face = MOOD_FACES[mood];
  return <Face width={size} height={size} />;
}

/** 1등 머리 위 왕관(18 x 14) */
export function Crown() {
  return <CrownIcon width={18} height={14} />;
}
