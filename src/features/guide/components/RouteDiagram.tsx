import React from "react";
import { Pressable, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { Text } from "@/common/components/Text";
import { cn } from "@/lib/cn";
import { useTheme } from "@/theme";
import {
  DIAGRAM_DOT_BAND,
  DIAGRAM_LABEL_STEP,
  linkPath,
  type DiagramNode,
  type RouteDiagramModel,
} from "../routeDiagram";

interface RouteDiagramProps {
  model: RouteDiagramModel;
  width: number;
  /** 역을 눌렀을 때. 경로의 역 목록에서의 순번을 준다 */
  onSelect?: (stopIndex: number) => void;
}

/** 세로로 쓴 이름의 글자 폭(px) */
const LABEL_WIDTH = 16;
/** 누르는 영역의 가로 폭(px). 점 사이가 좁아도 이웃 역과 겹치지 않게 한다 */
const MIN_HIT_WIDTH = 20;

function NodeDot({ node, background }: { node: DiagramNode; background: string }) {
  const { x, y, color } = node;
  if (node.state === "current") {
    return (
      <>
        <Circle cx={x} cy={y} r={15} fill={color} fillOpacity={0.2} />
        <Circle cx={x} cy={y} r={9} fill={color} stroke={background} strokeWidth={3} />
      </>
    );
  }
  if (node.kind === "end") return <Circle cx={x} cy={y} r={8} fill="#191F28" stroke={background} strokeWidth={2} />;
  if (node.kind === "transfer") {
    return (
      <Circle
        cx={x}
        cy={y}
        r={9}
        fill={background}
        stroke={color}
        strokeWidth={4}
        strokeOpacity={node.state === "passed" ? 1 : 0.75}
      />
    );
  }
  if (node.state === "passed") return <Circle cx={x} cy={y} r={6} fill={color} stroke={background} strokeWidth={2} />;
  return <Circle cx={x} cy={y} r={6} fill={background} stroke={color} strokeWidth={3} strokeOpacity={0.55} />;
}

/**
 * 안내 중 노선도. 열차 구간마다 가로 한 줄이고, 줄 끝에서 꺾여 반대 방향으로 이어 가는 S자(뱀) 모양이다.
 * 열차를 하나만 타면 한 줄 직선이다. 이름은 세로쓰기로 모든 역을 보여 주고, 꺾이는 환승역에는 큰 점과
 * 갈아탈 호선 이름을 붙인다. 선과 점은 SVG로, 이름은 글자 폰트를 쓰려고 겹쳐 놓은 Text로 그린다
 */
export function RouteDiagram({ model, width, onSelect }: RouteDiagramProps) {
  const { colors } = useTheme();
  const background = colors.bg;

  return (
    <View style={{ width, height: model.height }}>
      <Svg width={width} height={model.height} style={{ position: "absolute" }}>
        {model.links.map((link) => (
          <Path
            key={link.key}
            d={linkPath(link)}
            stroke={link.color}
            strokeWidth={link.dashed ? 4 : 6}
            strokeOpacity={link.passed ? 1 : 0.35}
            strokeDasharray={link.dashed ? "1 9" : undefined}
            strokeLinecap="round"
            fill="none"
          />
        ))}
        {model.nodes.map((node) => (
          <NodeDot key={node.key} node={node} background={background} />
        ))}
      </Svg>

      {model.nodes.map((node) => {
        const emphasized = node.state === "current" || node.kind !== "stop";
        const length = [...node.label].length * DIAGRAM_LABEL_STEP;
        return (
          <Pressable
            key={`hit-${node.key}`}
            accessibilityRole="button"
            accessibilityLabel={`${node.name}역 지도에서 보기`}
            disabled={!onSelect}
            hitSlop={4}
            onPress={() => onSelect?.(node.index)}
            style={{
              position: "absolute",
              left: node.x - MIN_HIT_WIDTH / 2,
              top: node.y - 10,
              width: MIN_HIT_WIDTH,
              height: DIAGRAM_DOT_BAND + length + 6,
            }}
          >
            {/* 이름은 세로쓰기다. 글자를 한 글자씩 위에서 아래로 쌓아 점 바로 아래에서 시작한다 */}
            <Text
              style={{
                position: "absolute",
                left: (MIN_HIT_WIDTH - LABEL_WIDTH) / 2,
                top: DIAGRAM_DOT_BAND - 6,
                width: LABEL_WIDTH,
                height: length,
                lineHeight: DIAGRAM_LABEL_STEP,
                textAlign: "center",
              }}
              className={cn(
                "text-small",
                emphasized ? "font-sans-bold text-text" : "font-sans-medium",
                !emphasized && node.state === "passed" ? "text-text-secondary" : "",
                !emphasized && node.state === "upcoming" ? "text-text" : ""
              )}
            >
              {[...node.label].join("\n")}
            </Text>
          </Pressable>
        );
      })}

      {model.transfers.map((transfer) => (
        <View
          key={transfer.key}
          pointerEvents="none"
          style={[
            { position: "absolute", top: transfer.y - 11, height: 22, justifyContent: "center" },
            transfer.align === "right" ? { right: width - transfer.x - 4 } : { left: transfer.x - 4 },
          ]}
        >
          <View
            style={{ backgroundColor: transfer.color, height: 22 }}
            className="items-center justify-center rounded-pill px-2.5"
          >
            <Text numberOfLines={1} className="text-caption font-sans-bold text-on-primary">
              {transfer.label}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
