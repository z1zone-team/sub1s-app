import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { Button } from "./Button";
import { Screen } from "./Screen";
import { Text } from "./Text";

interface LoginRequiredProps {
  /** 이 화면에서 로그인하면 무엇을 할 수 있는지 */
  description: string;
  /** 스택 헤더가 이미 있는 화면은 안전 영역을 중복해서 두지 않도록 []를 준다 */
  edges?: ("top" | "bottom")[];
}

/** 로그인이 필요한 화면의 공통 안내. 모든 화면이 같은 모양으로 로그인 화면으로 보낸다 */
export function LoginRequired({ description, edges }: LoginRequiredProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Screen edges={edges} contentClassName="justify-center gap-4 px-6">
      <Text className="text-title-lg font-sans-bold">로그인이 필요해요</Text>
      <Text className="text-body text-text-secondary">{description}</Text>
      <Button label="로그인" onPress={() => navigation.navigate("Login")} />
    </Screen>
  );
}
