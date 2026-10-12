import React from "react";
import Ghost from "@assets/svg/ghost-profile.svg";

/** MY 프로필 카드의 유령. 그림은 `assets/svg/ghost-profile.svg` (프로토타입 My.dc.html) */
export function ProfileMascot({ size = 56 }: { size?: number }) {
  return <Ghost width={size} height={size} />;
}
