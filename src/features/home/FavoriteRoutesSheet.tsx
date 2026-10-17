import React from "react";
import { Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import type { FavoriteRoute } from "@/apis/queries/users/favoriteRoutes";
import { BottomSheet } from "@/common/components/BottomSheet";
import { DesignIcon } from "@/common/components/DesignIcon";
import { Text } from "@/common/components/Text";
import { favoriteLabel } from "@/features/routing/favoriteRoutes";

interface FavoriteRoutesSheetProps {
  visible: boolean;
  signedIn: boolean;
  favorites: FavoriteRoute[] | undefined;
  loading: boolean;
  limit?: number;
  onClose: () => void;
  onSelect: (favorite: FavoriteRoute) => void;
  onRemove: (favorite: FavoriteRoute) => void;
  onLogin: () => void;
}

/** 홈 ★ 버튼으로 여는 즐겨찾기 경로 목록. 누르면 그 경로로 검색하고, 오른쪽 버튼으로 지운다 */
export function FavoriteRoutesSheet({
  visible,
  signedIn,
  favorites,
  loading,
  limit,
  onClose,
  onSelect,
  onRemove,
  onLogin,
}: FavoriteRoutesSheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  const count = favorites?.length ?? 0;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="flex-row items-baseline justify-between">
        <Text className="text-title-lg font-sans-bold">즐겨찾기 경로</Text>
        {signedIn && limit ? (
          <Text className="text-body-sm text-text-secondary">
            {count}/{limit}
          </Text>
        ) : null}
      </View>

      {!signedIn ? (
        <View className="items-center gap-3 py-8">
          <Text className="text-center text-body text-text-secondary">로그인하면 자주 가는 경로를 저장할 수 있어요</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onLogin}
            className="h-control items-center justify-center rounded-pill bg-primary px-6"
          >
            <Text className="text-body font-sans-bold text-on-primary">로그인</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <Text className="py-8 text-center text-text-secondary">불러오는 중이에요</Text>
      ) : count === 0 ? (
        <Text className="py-8 text-center text-body text-text-secondary">
          경로 목록 화면에서 별을 눌러 자주 가는 경로를 저장해 보세요
        </Text>
      ) : (
        <ScrollView className="mt-2" style={{ flexGrow: 0, maxHeight: windowHeight * 0.55 }} showsVerticalScrollIndicator={false}>
          {favorites?.map((favorite) => (
            <View key={favorite.id} className="h-15 flex-row items-center">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={favoriteLabel(favorite)}
                onPress={() => onSelect(favorite)}
                className="h-15 flex-1 flex-row items-center gap-3.5"
              >
                <View className="h-10 w-10 items-center justify-center rounded-md-plus bg-surface">
                  <DesignIcon name="star" size={18} filled />
                </View>
                <Text numberOfLines={1} className="flex-1 text-base font-sans-bold">
                  {favoriteLabel(favorite)}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${favoriteLabel(favorite)} 즐겨찾기 삭제`}
                onPress={() => onRemove(favorite)}
                className="h-11 w-11 items-center justify-center"
              >
                <DesignIcon name="close" size={18} tone="secondary" />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
    </BottomSheet>
  );
}
