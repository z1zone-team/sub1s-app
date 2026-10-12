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
  | "navigate"
  | "bell"
  | "undo"
  | "warning"
  | "play"
  | "pause"
  | "retry"
  | "settings"
  | "pulse"
  | "friends"
  | "notify"
  | "eye";

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
    case "bell":
      shapes = (
        <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0" fill="none" strokeWidth={strokeWidth ?? 2} {...common} />
      );
      break;
    case "settings":
      shapes = (
        <>
          <Circle cx={12} cy={12} r={3} fill="none" strokeWidth={strokeWidth ?? 1.8} {...common} />
          <Path
            d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
            fill="none"
            strokeWidth={strokeWidth ?? 1.8}
            {...common}
          />
        </>
      );
      break;
    case "pulse":
      shapes = (
        <>
          <Path d="M4 18c3 0 3-8 6-8s3 5 6 5 2-7 4-7" fill="none" strokeWidth={strokeWidth ?? 1.8} {...common} />
          <Circle cx={4} cy={18} r={1.6} fill={paint} stroke="none" />
          <Circle cx={20} cy={8} r={1.6} fill={paint} stroke="none" />
        </>
      );
      break;
    case "friends":
      shapes = (
        <>
          <Circle cx={9} cy={8} r={3.5} fill="none" strokeWidth={strokeWidth ?? 1.8} {...common} />
          <Path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.7 3 2.5 3.6 5.2" fill="none" strokeWidth={strokeWidth ?? 1.8} {...common} />
        </>
      );
      break;
    case "notify":
      shapes = <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4" fill="none" strokeWidth={strokeWidth ?? 1.8} {...common} />;
      break;
    case "eye":
      shapes = (
        <>
          <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" fill="none" strokeWidth={strokeWidth ?? 1.8} {...common} />
          <Circle cx={12} cy={12} r={3} fill="none" strokeWidth={strokeWidth ?? 1.8} {...common} />
        </>
      );
      break;
    case "play":
      shapes = <Path d="M7 4l13 8-13 8z" fill={paint} stroke="none" />;
      break;
    case "pause":
      shapes = (
        <>
          <Rect x={6} y={5} width={4} height={14} rx={1} fill={paint} />
          <Rect x={14} y={5} width={4} height={14} rx={1} fill={paint} />
        </>
      );
      break;
    case "retry":
      shapes = <Path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4" fill="none" strokeWidth={strokeWidth ?? 2} {...common} />;
      break;
    case "warning":
      shapes = (
        <>
          <Path d="M12 3l10 18H2z" fill="none" strokeWidth={strokeWidth ?? 2.2} {...common} />
          <Path d="M12 10v5M12 18v.5" fill="none" strokeWidth={strokeWidth ?? 2.2} {...common} />
        </>
      );
      break;
    case "undo":
      shapes = <Path d="M4 10h13a3 3 0 0 1 0 6h-3M8 6l-4 4 4 4" fill="none" strokeWidth={strokeWidth ?? 2} {...common} />;
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
