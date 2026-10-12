import React from "react";
import { Image } from "react-native";

const LOGO = require("../../../assets/logo.png");

interface BrandLogoProps {
  /** 한 변의 길이(px). 홈 검색 필 34, 로그인 104, 스플래시 200 */
  size: number;
  /** 모서리 반경(px). 프로토타입은 34는 9, 104는 24, 200은 46이다 */
  radius: number;
}

/** Sub1S 로고 이미지(파란 바탕에 열차 모양 글자와 유령). 크기에 맞춰 줄이고 모서리를 둥글게 자른다 */
export function BrandLogo({ size, radius }: BrandLogoProps) {
  return (
    <Image
      accessibilityLabel="Sub1S"
      source={LOGO}
      style={{ width: size, height: size, borderRadius: radius }}
      resizeMode="cover"
    />
  );
}
