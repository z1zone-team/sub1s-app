import React from "react";
import { Alert, Linking, Platform, Pressable, Share, View } from "react-native";
import { useInviteTokenQuery } from "@/apis/queries/users/useFriends";
import { BottomSheet } from "@/common/components/BottomSheet";
import { DesignIcon, type DesignIconName } from "@/common/components/DesignIcon";
import { Text } from "@/common/components/Text";
import { inviteLink, inviteMessage } from "@/features/friends/invite";

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
    <BottomSheet visible={visible} onClose={onClose} spacious>
      <Text className="text-title-lg font-sans-bold">친구 초대하기</Text>
      <Text className="mt-1.5 text-body text-text-secondary">링크로 들어온 친구와 서로 랭킹을 볼 수 있어요</Text>
      <View className="mt-5 h-13 flex-row items-center gap-2 rounded-md-plus bg-surface px-3.5">
        <DesignIcon name="link" size={18} tone="secondary" />
        <Text className="flex-1 text-body font-sans-semibold" numberOfLines={1}>
          {link || "링크를 만드는 중이에요"}
        </Text>
      </View>
      <View className="mt-5 flex-row gap-2">
        <Action icon="message" label="메시지" disabled={!link} onPress={() => void sendMessage()} />
        <Action icon="share" label="공유하기" disabled={!link} onPress={() => void Share.share({ message })} />
      </View>
    </BottomSheet>
  );
}
