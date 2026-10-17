import React from "react";
import { Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RiseIn } from "./RiseIn";
import { cn } from "@/lib/cn";

const SHEET_RADIUS = 24;

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  /** 손잡이 아래 간격과 아래 여백을 넉넉하게 준다. 내용이 짧은 시트에 쓴다 */
  spacious?: boolean;
  children: React.ReactNode;
}

/**
 * 어두운 배경 위로 아래에서 올라오는 시트. 배경을 누르거나 뒤로 가기를 누르면 닫힌다.
 * 모달, 배경, 올라오는 움직임, 손잡이, 둥근 모서리, 아래 안전 영역을 맡고 내용은 children이 그린다
 */
export function BottomSheet({ visible, onClose, spacious = false, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.56)" }}>
        <Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={onClose} className="absolute inset-0" />
        <RiseIn from={80} durationMs={300}>
          <View
            className="bg-bg px-5 pt-2.5"
            style={{
              borderTopLeftRadius: SHEET_RADIUS,
              borderTopRightRadius: SHEET_RADIUS,
              paddingBottom: Math.max(insets.bottom, 12) + (spacious ? 28 : 16),
            }}
          >
            <View className={cn("h-1 w-9 self-center rounded-pill bg-border", spacious ? "mb-5" : "mb-4")} />
            {children}
          </View>
        </RiseIn>
      </View>
    </Modal>
  );
}
