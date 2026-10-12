import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { useTheme } from "@/theme";
import { TONE_KEY, type IconTone } from "./Icon";

export type DesignIconName =
  | "mic"
  | "route"
  | "home"
  | "school"
  | "star"
  | "locate"
  | "clock"
  | "ranking"
  | "person"
  | "back"
  | "search"
  | "swap"
  | "close"
  | "walk"
  | "train"
  | "check"
  | "arrow"
  | "snow"
  | "navigate";

interface DesignIconProps {
  name: DesignIconName;
  size?: number;
  tone?: IconTone;
  /** 탭바처럼 색을 직접 받을 때. 주면 tone보다 우선한다 */
  color?: string;
  /** 활성 탭과 즐겨찾기 별처럼 속을 채운 모양 */
  filled?: boolean;
  /** 프로토타입에서 아이콘마다 다른 선 굵기 */
  strokeWidth?: number;
}

/**
 * docs/design/prototype의 SVG 경로를 그대로 옮긴 아이콘. 24 x 24 viewBox 기준이다.
 * Ionicons에 같은 모양이 없어서 프로토타입과 달라지는 곳에 쓴다
 */
export function DesignIcon({
  name,
  size = 24,
  tone = "text",
  color,
  filled = false,
  strokeWidth,
}: DesignIconProps) {
  const { colors } = useTheme();
  const paint = color ?? colors[TONE_KEY[tone]];
  const fill = filled ? paint : "none";
  const common = { stroke: paint, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  let shapes: React.ReactNode;
  switch (name) {
    case "mic":
      shapes = (
        <>
          <Rect x={9} y={3} width={6} height={11} rx={3} fill={fill} stroke={paint} strokeWidth={strokeWidth ?? 1.8} />
          <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" fill="none" strokeWidth={strokeWidth ?? 1.8} {...common} />
        </>
      );
      break;
    case "route":
      shapes = <Path d="M6 20v-7a4 4 0 0 1 4-4h9M15 5l4 4-4 4" fill="none" strokeWidth={strokeWidth ?? 2.2} {...common} />;
      break;
    case "home":
      shapes = (
        <Path
          d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"
          fill={fill}
          strokeWidth={strokeWidth ?? 2}
          {...common}
        />
      );
      break;
    case "school":
      shapes = <Path d="M2 9l10-5 10 5-10 5zM6 11v5c3 2.5 9 2.5 12 0v-5" fill={fill} strokeWidth={strokeWidth ?? 2} {...common} />;
      break;
    case "star":
      shapes = (
        <Path
          d="M12 3l2.8 5.8 6.2.8-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.8z"
          fill={fill}
          strokeWidth={strokeWidth ?? (filled ? 1.5 : 1.8)}
          {...common}
        />
      );
      break;
    case "locate":
      shapes = (
        <>
          <Circle cx={12} cy={12} r={7} fill="none" strokeWidth={strokeWidth ?? 1.8} {...common} />
          <Circle cx={12} cy={12} r={2.5} fill={paint} strokeWidth={strokeWidth ?? 1.8} {...common} />
          <Path d="M12 2v3M12 19v3M2 12h3M19 12h3" fill="none" strokeWidth={strokeWidth ?? 1.8} {...common} />
        </>
      );
      break;
    case "clock":
      shapes = (
        <>
          <Circle cx={12} cy={12} r={9} fill="none" strokeWidth={strokeWidth ?? 2} {...common} />
          <Path d="M12 7v5l3 2" fill="none" strokeWidth={strokeWidth ?? 2} {...common} />
        </>
      );
      break;
    case "ranking":
      shapes = filled ? (
        <>
          <Path d="M5 20v-6h4v6zM10 20V9h4v11zM15 20v-8h4v8z" fill={paint} strokeWidth={strokeWidth ?? 1.8} {...common} />
          <Path d="M3 20h18" fill="none" strokeWidth={strokeWidth ?? 1.8} {...common} />
        </>
      ) : (
        <Path d="M3 20h18M5 20v-6h4v6M10 20V9h4v11M15 20v-8h4v8" fill="none" strokeWidth={strokeWidth ?? 1.8} {...common} />
      );
      break;
    case "back":
      shapes = <Path d="M15 5l-7 7 7 7" fill="none" strokeWidth={strokeWidth ?? 2} {...common} />;
      break;
    case "search":
      shapes = (
        <>
          <Circle cx={11} cy={11} r={7} fill="none" strokeWidth={strokeWidth ?? 2} {...common} />
          <Path d="M20 20l-4-4" fill="none" strokeWidth={strokeWidth ?? 2} {...common} />
        </>
      );
      break;
    case "swap":
      shapes = <Path d="M8 4v16M4 8l4-4 4 4M16 20V4M12 16l4 4 4-4" fill="none" strokeWidth={strokeWidth ?? 1.8} {...common} />;
      break;
    case "close":
      shapes = <Path d="M6 6l12 12M18 6L6 18" fill="none" strokeWidth={strokeWidth ?? 2.2} {...common} />;
      break;
    case "walk":
      shapes = (
        <>
          <Circle cx={13} cy={4} r={2} fill="none" strokeWidth={strokeWidth ?? 2.4} {...common} />
          <Path d="M10 21l2-6 3 3v3M8 12l3-4 4 1 2 4" fill="none" strokeWidth={strokeWidth ?? 2.4} {...common} />
        </>
      );
      break;
    case "train":
      shapes = (
        <>
          <Rect x={5} y={3} width={14} height={15} rx={3} fill="none" stroke={paint} strokeWidth={strokeWidth ?? 2} strokeLinejoin="round" />
          <Path d="M5 11h14M8 21l2-3M16 21l-2-3" fill="none" strokeWidth={strokeWidth ?? 2} {...common} />
        </>
      );
      break;
    case "check":
      shapes = (
        <>
          <Circle cx={12} cy={12} r={9} fill="none" strokeWidth={strokeWidth ?? 2.6} {...common} />
          <Path d="M8 12.5l3 3 5-6" fill="none" strokeWidth={strokeWidth ?? 2.6} {...common} />
        </>
      );
      break;
    case "arrow":
      shapes = <Path d="M5 12h14M13 6l6 6-6 6" fill="none" strokeWidth={strokeWidth ?? 2} {...common} />;
      break;
    case "snow":
      shapes = (
        <Path
          d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 4l3 2 3-2M9 20l3-2 3 2"
          fill="none"
          strokeWidth={strokeWidth ?? 2}
          {...common}
        />
      );
      break;
    case "navigate":
      shapes = <Path d="M3 11l18-8-8 18-2-8z" fill={paint} stroke={paint} strokeWidth={strokeWidth ?? 1} strokeLinejoin="round" />;
      break;
    case "person":
      shapes = (
        <>
          <Circle cx={12} cy={8} r={4} fill={fill} strokeWidth={strokeWidth ?? 1.8} {...common} />
          <Path
            d={filled ? "M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6z" : "M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"}
            fill={fill}
            strokeWidth={strokeWidth ?? 1.8}
            {...common}
          />
        </>
      );
      break;
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {shapes}
    </Svg>
  );
}
