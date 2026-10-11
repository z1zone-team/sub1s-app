import React, { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button } from "@/common/components/Button";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { useAcceptInviteMutation } from "@/apis/queries/users/useFriends";
import { acceptErrorMessage, isInviteToken } from "@/features/friends/invite";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { useTheme } from "@/theme";

export function InviteScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "Invite">) {
  const { colors } = useTheme();
  const { isSignedIn, isLoaded } = useAuth();
  const accept = useAcceptInviteMutation();
  const { token } = route.params;
  const started = useRef(false);
  const validToken = isInviteToken(token);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !validToken || started.current) return;
    started.current = true;
    accept.mutate(token);
  }, [isLoaded, isSignedIn, validToken, token, accept]);

  const home = () => navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });

  let body: React.ReactNode;
  if (!validToken) {
    body = <Text>올바르지 않은 초대 링크예요</Text>;
  } else if (isLoaded && !isSignedIn) {
    body = (
      <>
        <Text className="text-center">
          로그인하면 친구로 추가할 수 있어요. 로그인한 뒤 초대 링크를 다시 눌러 주세요
        </Text>
        <Button label="로그인" onPress={() => navigation.navigate("Login")} />
      </>
    );
  } else if (accept.isSuccess) {
    body = (
      <>
        <Text className="text-title font-sans-extrabold">
          {accept.data.nickname}님과 친구가 되었어요
        </Text>
        <Button label="친구 보기" onPress={() => navigation.replace("Friends")} />
      </>
    );
  } else if (accept.error) {
    body = <Text className="text-center text-error">{acceptErrorMessage(accept.error)}</Text>;
  } else {
    body = <ActivityIndicator color={colors.primary} />;
  }

  return (
    <Screen edges={[]} contentClassName="items-center justify-center gap-4 p-6">
      <View className="items-center gap-4">{body}</View>
      <Button label="홈으로" variant="ghost" onPress={home} />
    </Screen>
  );
}
