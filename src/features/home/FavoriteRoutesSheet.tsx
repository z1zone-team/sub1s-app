import React from "react";
import { Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import type { FavoriteRoute } from "@/apis/queries/users/favoriteRoutes";
import type { FavoritePlace } from "@/apis/queries/users/favoritePlaces";
import { BottomSheet } from "@/common/components/BottomSheet";
import { DesignIcon } from "@/common/components/DesignIcon";
import { Text } from "@/common/components/Text";
import { favoriteLabel } from "@/features/routing/favoriteRoutes";

interface FavoriteRoutesSheetProps {
  visible: boolean;
  signedIn: boolean;
  favorites: FavoriteRoute[] | undefined;
  places?: FavoritePlace[];
  loading: boolean;
  limit?: number;
  placeLimit?: number;
  onClose: () => void;
  onSelect: (favorite: FavoriteRoute) => void;
  onRemove: (favorite: FavoriteRoute) => void;
  onSelectPlace?: (place: FavoritePlace) => void;
  onRemovePlace?: (place: FavoritePlace) => void;
  onLogin: () => void;
}

function FavoriteRow({ label, onPress, onRemove }: { label: string; onPress: () => void; onRemove: () => void }) {
  return (
    <View className="h-15 flex-row items-center">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        className="h-15 flex-1 flex-row items-center gap-3.5"
      >
        <View className="h-10 w-10 items-center justify-center rounded-md-plus bg-surface">
          <DesignIcon name="star" size={18} filled />
        </View>
        <Text numberOfLines={1} className="flex-1 text-base font-sans-bold">
          {label}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} 즐겨찾기 삭제`}
        onPress={onRemove}
        className="h-11 w-11 items-center justify-center"
      >
        <DesignIcon name="close" size={18} tone="secondary" />
      </Pressable>
    </View>
  );
}

function SectionTitle({ title, count, limit }: { title: string; count: number; limit?: number }) {
  return (
    <View className="mt-3 flex-row items-baseline justify-between">
      <Text className="text-body font-sans-bold text-text-secondary">{title}</Text>
      {limit ? (
        <Text className="text-body-sm text-text-secondary">
          {count}/{limit}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * 홈 ★ 버튼으로 여는 즐겨찾기 목록. 장소와 경로를 묶어 보여 준다.
 * 누르면 그 장소를 도착지로, 또는 그 경로로 검색하고, 오른쪽 버튼으로 지운다
 */
export function FavoriteRoutesSheet({
  visible,
  signedIn,
  favorites,
  places,
  loading,
  limit,
  placeLimit,
  onClose,
  onSelect,
  onRemove,
  onSelectPlace,
  onRemovePlace,
  onLogin,
}: FavoriteRoutesSheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  const routeCount = favorites?.length ?? 0;
  const placeCount = places?.length ?? 0;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text className="text-title-lg font-sans-bold">즐겨찾기</Text>

      {!signedIn ? (
        <View className="items-center gap-3 py-8">
          <Text className="text-center text-body text-text-secondary">로그인하면 자주 가는 곳과 경로를 저장할 수 있어요</Text>
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
      ) : routeCount === 0 && placeCount === 0 ? (
        <Text className="py-8 text-center text-body text-text-secondary">
          장소 카드나 경로 목록 화면에서 별을 눌러 자주 가는 곳을 저장해 보세요
        </Text>
      ) : (
        <ScrollView className="mt-1" style={{ flexGrow: 0, maxHeight: windowHeight * 0.55 }} showsVerticalScrollIndicator={false}>
          <SectionTitle title="장소" count={placeCount} limit={placeLimit} />
          {placeCount === 0 ? (
            <Text className="py-3 text-body-sm text-text-secondary">장소 카드에서 별을 눌러 저장해 보세요</Text>
          ) : (
            places?.map((place) => (
              <FavoriteRow
                key={place.id}
                label={place.name}
                onPress={() => onSelectPlace?.(place)}
                onRemove={() => onRemovePlace?.(place)}
              />
            ))
          )}
          <SectionTitle title="경로" count={routeCount} limit={limit} />
          {routeCount === 0 ? (
            <Text className="py-3 text-body-sm text-text-secondary">경로 목록 화면에서 별을 눌러 저장해 보세요</Text>
          ) : (
            favorites?.map((favorite) => (
              <FavoriteRow
                key={favorite.id}
                label={favoriteLabel(favorite)}
                onPress={() => onSelect(favorite)}
                onRemove={() => onRemove(favorite)}
              />
            ))
          )}
        </ScrollView>
      )}
    </BottomSheet>
  );
}
