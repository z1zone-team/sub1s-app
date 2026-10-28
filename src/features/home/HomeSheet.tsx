import React from "react";
import { Pressable, View } from "react-native";
import { DraggableSheet, SHEET_HANDLE_VISIBLE_HEIGHT } from "@/common/components/DraggableSheet";
import { Text } from "@/common/components/Text";

/** 제목 줄의 높이: h-control(44) + 아래 여백 mb-1.5(6) */
const HEADER_ROW_HEIGHT = 50;
/** 시트 위쪽 테두리 */
const SHEET_BORDER = 1;
/** 시트 목록 한 줄의 높이(h-15). 목록 줄과 빈 목록 안내가 이 높이를 쓴다 */
export const HOME_SHEET_ROW_HEIGHT = 60;
/** 접힌 시트가 탭바 위로 보이는 높이. 손잡이, 제목 줄, 목록 한 줄만 보여 지도가 넓게 보인다 */
export const SHEET_PEEK_HEIGHT = SHEET_HANDLE_VISIBLE_HEIGHT + HEADER_ROW_HEIGHT + HOME_SHEET_ROW_HEIGHT + SHEET_BORDER;

interface HomeSheetProps {
  /** 시트가 놓이는 영역의 높이. 접힌 위치를 계산한다 */
  containerHeight: number;
  /** 펼쳤을 때 위에 남기는 여백 (상태 표시줄) */
  topInset: number;
  title: string;
  actionLabel: string;
  onActionPress: () => void;
  children: React.ReactNode;
}

/**
 * 시트 어디를 끌어도 오르내리는 홈 바텀시트. 위로 끌면 전체 화면 가까이 펼쳐지고, 아래로 끌면 중간(제목 줄)을 지나
 * 손잡이만 남아 지도가 크게 보인다. 펼친 시트는 목록이 맨 위일 때만 아래로 끌린다. 펼쳐지지 않은 상태에서는 목록이 스크롤되지 않는다
 */
export function HomeSheet({ containerHeight, topInset, title, actionLabel, onActionPress, children }: HomeSheetProps) {
  return (
    <DraggableSheet
      label={title}
      height={Math.max(containerHeight - topInset, SHEET_PEEK_HEIGHT)}
      middleHeight={SHEET_PEEK_HEIGHT}
      initial="MIDDLE"
      scrollable
      className="px-6"
      header={
        <View className="mb-1.5 h-control flex-row items-center justify-between">
          <Text className="text-title font-sans-bold">{title}</Text>
          <Pressable accessibilityRole="button" onPress={onActionPress} className="min-h-control justify-center">
            <Text className="text-body-sm font-sans-semibold text-accent">{actionLabel}</Text>
          </Pressable>
        </View>
      }
    >
      {children}
    </DraggableSheet>
  );
}
