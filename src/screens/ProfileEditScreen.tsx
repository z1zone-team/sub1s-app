import React, { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ApiError } from "@/apis/client";
import { useUpdateProfileMutation } from "@/apis/mutations/users/useUpdateProfileMutation";
import { useGetMe } from "@/apis/queries/auth/useGetMe";
import { Button } from "@/common/components/Button";
import { Screen } from "@/common/components/Screen";
import { nameError, nicknameError } from "@/features/profile/profileView";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { useTheme } from "@/theme";

function serverMessage(error: Error): string {
  if (error instanceof ApiError && error.code === "NICKNAME_TAKEN") return "이미 사용 중인 닉네임이에요";
  if (error instanceof ApiError && error.status === 400) return "입력한 내용을 다시 확인해 주세요";
  return "저장하지 못했어요. 다시 시도해 주세요.";
}

export function ProfileEditScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "ProfileEdit">) {
  const { colors } = useTheme();
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

  const inputStyle = {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 16,
  } as const;

  return (
    <Screen edges={[]} scroll contentStyle={{ paddingHorizontal: 24, paddingTop: 16, gap: 16 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>이름</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="이름 (선택)"
          placeholderTextColor={colors.textDisabled}
          maxLength={40}
          style={inputStyle}
        />
        {nmError ? <Text style={{ fontSize: 12, color: colors.error }}>{nmError}</Text> : null}
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>닉네임</Text>
        <TextInput
          value={nickname}
          onChangeText={setNickname}
          placeholder="2~20자"
          placeholderTextColor={colors.textDisabled}
          autoCapitalize="none"
          autoCorrect={false}
          style={inputStyle}
        />
        {nickError ? <Text style={{ fontSize: 12, color: colors.error }}>{nickError}</Text> : null}
      </View>

      {save.error ? (
        <Text style={{ fontSize: 13, color: colors.error }}>{serverMessage(save.error)}</Text>
      ) : null}

      <Button label="저장" onPress={submit} disabled={!canSave} loading={save.isPending} />
    </Screen>
  );
}
