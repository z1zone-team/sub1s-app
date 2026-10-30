import React from "react";
import { MoodFace, type MoodFaceKey } from "@/features/ranking/components/RankCharacters";

/** MY 프로필 카드의 유령. 표정은 이번 달 이동 거리로 정하고, 그림은 랭킹의 표정 카드와 같다 */
export function ProfileMascot({ size = 56, mood = "NORMAL" }: { size?: number; mood?: MoodFaceKey }) {
  return <MoodFace mood={mood} size={size} />;
}
