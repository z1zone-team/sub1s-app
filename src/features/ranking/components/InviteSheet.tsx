import React from "react";
import { Alert, Linking, Modal, Platform, Pressable, Share, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInviteTokenQuery } from "@/apis/queries/users/useFriends";
import { DesignIcon, type DesignIconName } from "@/common/components/DesignIcon";
import { RiseIn } from "@/common/components/RiseIn";
import { Text } from "@/common/components/Text";
import { inviteLink, inviteMessage } from "@/features/friends/invite";

const SHEET_RADIUS = 24;

interface InviteSheetProps {
  visible: boolean;
  onClose: () => void;
}

function Action({ icon, label, onPress, disabled }: { icon: DesignIconName; label: string; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={disabled ? "h-20 flex-1 items-center justify-center gap-2 rounded-lg border border-border opacity-50" : "h-20 flex-1 items-center justify-center gap-2 rounded-lg border border-border"}
    >
      <DesignIcon name={icon} size={22} />
      <Text className="text-body-sm font-sans-semibold">{label}</Text>
    </Pressable>
  );
}

/** 친구 초대 바텀시트. 프로토타입의 복사와 QR 코드는 클립보드와 QR 라이브러리가 없어 빼고 메시지와 공유만 둔다 */
export function InviteSheet({ visible, onClose }: InviteSheetProps) {
  const insets = useSafeAreaInsets();
  const invite = useInviteTokenQuery(visible);
  const link = invite.data ? inviteLink(invite.data.inviteToken) : "";
  const message = link ? inviteMessage(link) : "";

  const sendMessage = async () => {
    const body = encodeURIComponent(message);
    try {
      await Linking.openURL(Platform.OS === "ios" ? `sms:&body=${body}` : `sms:?body=${body}`);
    } catch {
      Alert.alert("메시지 앱을 열 수 없어요");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,26,69,0.4)" }}>
        <Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={onClose} className="absolute inset-0" />
        <RiseIn from={80} durationMs={300}>
          <View
            className="bg-bg px-5 pt-2.5"
            style={{ borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS, paddingBottom: Math.max(insets.bottom, 12) + 28 }}
          >
            <View className="mb-5 h-1 w-9 self-center rounded-pill bg-border" />
            <Text className="text-title-lg font-sans-bold">친구 초대하기</Text>
            <Text className="mt-1.5 text-body text-text-secondary">링크로 들어온 친구와 서로 랭킹을 볼 수 있어요</Text>
            <View className="mt-5 h-13 flex-row items-center gap-2 rounded-md bg-surface px-3.5">
              <DesignIcon name="link" size={18} tone="secondary" />
              <Text className="flex-1 text-body font-sans-semibold" numberOfLines={1}>
                {link || "링크를 만드는 중이에요"}
              </Text>
            </View>
            <View className="mt-5 flex-row gap-2">
              <Action icon="message" label="메시지" disabled={!link} onPress={() => void sendMessage()} />
              <Action icon="share" label="공유하기" disabled={!link} onPress={() => void Share.share({ message })} />
            </View>
          </View>
        </RiseIn>
      </View>
    </Modal>
  );
}
