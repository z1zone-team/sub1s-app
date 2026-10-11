/**
 * 디자인 토큰. 색 값은 src/theme/palette.ts가 단일 출처이고 ThemeVars가 CSS 변수로 내려보낸다.
 * 여기에는 변수 이름만 둔다. 이름이 palette와 어긋나지 않는지는 src/theme/tokens.test.ts가 확인한다.
 */
const colorToken = (name) => `var(--color-${name})`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./index.ts",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: colorToken("primary"),
          dark: colorToken("primary-dark"),
          light: colorToken("primary-light"),
          tint: colorToken("primary-tint"),
        },
        accent: colorToken("accent"),
        bg: colorToken("bg"),
        surface: colorToken("surface"),
        border: colorToken("border"),
        text: {
          DEFAULT: colorToken("text"),
          secondary: colorToken("text-secondary"),
          disabled: colorToken("text-disabled"),
        },
        "on-primary": colorToken("on-primary"),
        success: colorToken("success"),
        warning: colorToken("warning"),
        error: colorToken("error"),
        info: colorToken("info"),
        subway: {
          line1: "#0052A4",
          line2: "#00A84D",
          line3: "#EF7C1C",
          line4: "#00A5DE",
          line5: "#996CAC",
          line6: "#CD7C2F",
          line7: "#747F00",
          line8: "#E6186C",
          line9: "#BDB092",
          shinbundang: "#D4003B",
          suinbundang: "#F5A200",
          airport: "#0090D2",
          gyeongui: "#77C4A3",
        },
        congestion: {
          smooth: "#22C55E",
          normal: "#3B82F6",
          caution: "#F59E0B",
          congested: "#EF4444",
        },
      },
      /** 프로토타입에서 쓰는 글자 크기 */
      fontSize: {
        micro: "9px",
        tiny: "10px",
        caption: "11px",
        small: "12px",
        "body-sm": "13px",
        body: "14px",
        subtitle: "15px",
        base: "16px",
        title: "18px",
        "title-lg": "20px",
        headline: "22px",
        "headline-lg": "26px",
        display: "30px",
        "display-lg": "34px",
        hero: "40px",
      },
      /** 굵기마다 글꼴 파일이 달라서(안드로이드) 굵기는 font-weight 대신 글꼴 이름으로 고른다 */
      fontFamily: {
        sans: ["Pretendard-Regular"],
        "sans-medium": ["Pretendard-Medium"],
        "sans-semibold": ["Pretendard-SemiBold"],
        "sans-bold": ["Pretendard-Bold"],
        "sans-extrabold": ["Pretendard-ExtraBold"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        pill: "999px",
      },
      height: {
        control: "44px",
        "control-lg": "52px",
      },
      minHeight: {
        control: "44px",
        "control-lg": "52px",
      },
    },
  },
  plugins: [],
};
