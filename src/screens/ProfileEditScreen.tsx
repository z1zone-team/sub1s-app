import React, { useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ApiError } from "@/apis/client";
import { useUpdateProfileMutation } from "@/apis/mutations/users/useUpdateProfileMutation";
import { useGetMe } from "@/apis/queries/auth/useGetMe";
import { Button } from "@/common/components/Button";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { nameError, nicknameError } from "@/features/profile/profileView";
import type { RootStackParamList } from "@/navigation/navigation-types";

const INPUT = "h-row rounded-md border border-border px-3.5 font-sans text-base text-text";

function serverMessage(error: Error): string {
  if (error instanceof ApiError && error.code === "NICKNAME_TAKEN") return "이미 사용 중인 닉네임이에요";
  if (error instanceof ApiError && error.status === 400) return "입력한 내용을 다시 확인해 주세요";
  return "저장하지 못했어요. 다시 시도해 주세요.";
}

export function ProfileEditScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "ProfileEdit">) {
  const me = useGetMe();
  const save = useUpdateProfileMutation();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (me.data && !seeded) {
      setName(me.data.name ?? "");
      setNickname(me.data.nickname);
      setSeeded(true);
    }
  }, [me.data, seeded]);

  const nickError = seeded ? nicknameError(nickname) : "";
  const nmError = nameError(name);
  const canSave = seeded && !nickError && !nmError && !save.isPending;

  const submit = () => {
    const trimmedName = name.trim();
    save.mutate(
      { name: trimmedName === "" ? null : trimmedName, nickname: nickname.trim() },
      { onSuccess: () => navigation.goBack() }
    );
  };

  return (
    <Screen edges={[]} scroll contentClassName="gap-4 px-6 pt-4">
      <View className="gap-1.5">
        <Text className="text-body-sm text-text-secondary">이름</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="이름 (선택)"
          placeholderClassName="text-text-disabled"
          maxLength={40}
          className={INPUT}
        />
        {nmError ? <Text className="text-small text-error">{nmError}</Text> : null}
      </View>

      <View className="gap-1.5">
        <Text className="text-body-sm text-text-secondary">닉네임</Text>
        <TextInput
          value={nickname}
          onChangeText={setNickname}
          placeholder="2~20자"
          placeholderClassName="text-text-disabled"
          autoCapitalize="none"
          autoCorrect={false}
          className={INPUT}
        />
        {nickError ? <Text className="text-small text-error">{nickError}</Text> : null}
      </View>

      {save.error ? <Text className="text-body-sm text-error">{serverMessage(save.error)}</Text> : null}

      <Button label="저장" onPress={submit} disabled={!canSave} loading={save.isPending} />
    </Screen>
  );
}
