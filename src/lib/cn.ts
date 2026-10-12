import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** tailwind.config.js의 fontSize, fontFamily, borderRadius 토큰 이름. 설정과 어긋나지 않는지는 cn.test.ts가 확인한다 */
export const FONT_SIZE_TOKENS = [
  "nano",
  "micro",
  "tiny",
  "caption",
  "small",
  "body-sm",
  "body",
  "subtitle",
  "heading",
  "title",
  "title-lg",
  "headline",
  "headline-md", "headline-sm",
  "headline-lg",
  "display-sm",
  "display",
  "display-md",
  "display-lg",
  "hero",
  "hero-lg", "display-xl",
] as const;

export const FONT_FAMILY_TOKENS = ["sans-medium", "sans-semibold", "sans-bold", "sans-extrabold"] as const;

export const RADIUS_TOKENS = ["3xs", "2xs", "xs-plus", "sm-mid", "sm-plus", "lg-plus", "pill"] as const;

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [...FONT_SIZE_TOKENS] }],
      "font-family": [{ font: [...FONT_FAMILY_TOKENS] }],
    },
    theme: {
      borderRadius: [...RADIUS_TOKENS],
    },
  },
});

/** 클래스를 조건부로 합치고 같은 종류가 겹치면 뒤에 온 것을 남긴다 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
