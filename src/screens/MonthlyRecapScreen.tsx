import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Animated, Easing, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { useAuth } from "@clerk/expo";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useTravelStatsQuery } from "@/apis/queries/profile/useTravelStatsQuery";
import { BackButton } from "@/common/components/BackButton";
import { DesignIcon, type DesignIconName } from "@/common/components/DesignIcon";
import { LoginRequired } from "@/common/components/LoginRequired";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { parseMonthKey } from "@/common/utils/monthKey";
import { ArrivedMascot } from "@/features/guide/components/ArrivedMascot";
import { recapCards, type RecapCard } from "@/features/recap/recapView";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { palettes, useTheme } from "@/theme";

type Props = NativeStackScreenProps<RootStackParamList, "MonthlyRecap">;

const CARD_ICONS: Record<RecapCard["key"], DesignIconName> = {
  cover: "train", distance: "route", rides: "swap", places: "locate", peak: "clock", finish: "navigate", empty: "train",
};

function StoryCard({ card, width, current, motionEnabled }: {
  card: RecapCard;
  width: number;
  current: boolean;
  motionEnabled: boolean;
}) {
  const { colors } = useTheme();
  const hero = card.key === "cover" || card.key === "finish";
  const background = hero ? palettes.light.primary : colors.primaryTint;
  const titleColor = hero ? palettes.light.onPrimary : colors.text;
  const accent = hero ? palettes.light.onPrimary : colors.primary;
  const railColor = card.lineColor ?? accent;
  const intro = useRef(new Animated.Value(1)).current;
  const highlight = useRef(new Animated.Value(1)).current;
  const rail = useRef(new Animated.Value(1)).current;

  useLayoutEffect(() => {
    const play = current && motionEnabled;
    intro.setValue(play ? 0 : 1);
    highlight.setValue(play ? 0 : 1);
    rail.setValue(play ? 0 : 1);
    if (!play) return;

    const reveal = (value: Animated.Value, duration: number) => Animated.timing(value, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    const animation = Animated.stagger(80, [reveal(intro, 230), reveal(highlight, 320), reveal(rail, 340)]);
    animation.start();
    return () => animation.stop();
  }, [current, motionEnabled, intro, highlight, rail]);
  return (
    <ScrollView
      style={{ width, backgroundColor: background }}
      contentContainerStyle={styles.card}
      showsVerticalScrollIndicator={false}
      importantForAccessibility={current ? "auto" : "no-hide-descendants"}
      accessibilityElementsHidden={!current}
    >
      <Animated.View style={[styles.cardGroup, { opacity: intro }]}>
        <View style={[styles.sign, { borderColor: accent }]}>
          <DesignIcon name={CARD_ICONS[card.key]} color={accent} size={27} />
        </View>
        <Text accessibilityRole="header" className="font-sans-bold" style={[styles.title, { color: titleColor }]}>
          {card.title}
        </Text>
      </Animated.View>
      {card.value || card.detail || card.key === "cover" ? (
        <Animated.View style={[styles.cardGroup, {
          opacity: highlight,
          transform: [{ translateY: highlight.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        }]}>
          {card.value ? (
            <View style={styles.valueRow}>
              <Text className="font-sans-bold" numberOfLines={2} style={[styles.value, { color: accent, fontSize: card.unit ? 72 : 47 }]}>
                {card.value}
              </Text>
              {card.unit ? <Text className="font-sans-bold" style={[styles.unit, { color: accent }]}>{card.unit}</Text> : null}
            </View>
          ) : null}
          {card.detail ? <Text style={[styles.detail, { color: hero ? titleColor : colors.textSecondary }]}>{card.detail}</Text> : null}
          {card.key === "cover" ? <View style={styles.mascot}><ArrivedMascot size={130} /></View> : null}
        </Animated.View>
      ) : null}
      <Animated.View accessible={false} style={[styles.rail, { opacity: rail }]}>
        <Animated.View style={[styles.railLine, { backgroundColor: railColor, transform: [{ scaleX: rail }] }]} />
        {[0, 1, 2, 3].map((station) => (
          <View key={station} style={[styles.station, { borderColor: railColor, backgroundColor: station === 2 ? railColor : background }]} />
        ))}
      </Animated.View>
    </ScrollView>
  );
}

function Story({ cards, periodLabel, onClose, onTimeline }: {
  cards: RecapCard[];
  periodLabel: string;
  onClose: () => void;
  onTimeline: () => void;
}) {
  const { width } = useWindowDimensions();
  const { colors, scheme } = useTheme();
  const pager = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const current = Math.min(index, cards.length - 1);
  const last = current === cards.length - 1;

  useEffect(() => {
    let listening = true;
    let receivedChange = false;
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (reduced) => {
      receivedChange = true;
      setMotionEnabled(!reduced);
    });
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (listening && !receivedChange) setMotionEnabled(!reduced);
    }).catch(() => undefined);
    return () => {
      listening = false;
      subscription.remove();
    };
  }, []);

  const go = (page: number) => {
    setIndex(page);
    pager.current?.scrollTo({ x: page * width, animated: motionEnabled });
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.screen, { backgroundColor: colors.bg }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <View style={styles.header}>
        <View style={styles.progress} accessibilityLabel={`${cards.length}장 중 ${current + 1}장`}>
          {cards.map((card, i) => <View key={card.key} style={[styles.segment, { backgroundColor: i <= current ? colors.primary : colors.border }]} />)}
        </View>
        <View style={styles.headerRow}>
          <Text className="font-sans-bold" style={styles.period}>{periodLabel} 정산</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="정산 닫기" hitSlop={8} onPress={onClose} style={[styles.iconButton, { borderColor: colors.border }]}>
            <DesignIcon name="close" size={23} />
          </Pressable>
        </View>
      </View>
      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
        style={styles.pager}
      >
        {cards.map((card, i) => <StoryCard key={card.key} card={card} width={width} current={i === current} motionEnabled={motionEnabled} />)}
      </ScrollView>
      <View style={styles.footer}>
        {current > 0 ? (
          <Pressable accessibilityRole="button" accessibilityLabel="이전 카드" style={[styles.iconButton, { borderColor: colors.border }]} onPress={() => go(current - 1)}>
            <DesignIcon name="back" size={22} />
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" style={[styles.action, { backgroundColor: palettes.light.primary }]} onPress={last ? onTimeline : () => go(current + 1)}>
          <Text className="font-sans-bold" style={[styles.actionText, { color: palettes.light.onPrimary }]}>{last ? "상세 기록 보기" : current === 0 ? "정산 시작" : "다음"}</Text>
          <DesignIcon name="arrow" color={palettes.light.onPrimary} size={20} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export function MonthlyRecapScreen({ navigation, route }: Props) {
  const { periodKey, openedAt } = route.params;
  const month = parseMonthKey(periodKey);
  const { isLoaded, isSignedIn } = useAuth();
  const { colors, scheme } = useTheme();
  const stats = useTravelStatsQuery("MONTH", { periodKey }, { enabled: Boolean(month) });
  if (!isLoaded || (isSignedIn && month && stats.isPending)) {
    return <SafeAreaView style={[styles.screen, styles.center, { backgroundColor: colors.bg }]}><StatusBar style={scheme === "dark" ? "light" : "dark"} /><ActivityIndicator accessibilityLabel="정산 불러오는 중" color={colors.primary} /></SafeAreaView>;
  }
  if (!isSignedIn) {
    return <Screen><BackButton onPress={() => navigation.goBack()} /><LoginRequired edges={[]} description="로그인하면 월말정산을 볼 수 있어요" /></Screen>;
  }
  if (!month || !stats.data) {
    return (
      <SafeAreaView style={[styles.screen, styles.center, { backgroundColor: colors.bg }]}>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <Text className="font-sans-bold" style={styles.period}>{month ? "정산을 불러오지 못했어요" : "정산 월을 확인할 수 없어요"}</Text>
        {month ? <Pressable accessibilityRole="button" onPress={() => void stats.refetch()}><Text style={[styles.link, { color: colors.primary }]}>다시 시도</Text></Pressable> : null}
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()}><Text style={[styles.link, { color: colors.primary }]}>닫기</Text></Pressable>
      </SafeAreaView>
    );
  }
  return (
    <Story
      key={`${periodKey}-${openedAt ?? 0}`}
      cards={recapCards(month.month, stats.data)}
      periodLabel={`${month.year}년 ${month.month}월`}
      onClose={() => navigation.goBack()}
      onTimeline={() => navigation.navigate("Timeline", { periodKey, pushOpenedAt: Date.now() })}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10 },
  progress: { flexDirection: "row", gap: 5 },
  segment: { flex: 1, height: 3, borderRadius: 2 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
  period: { fontSize: 17 },
  iconButton: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  pager: { flex: 1 },
  card: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 28, paddingVertical: 28, gap: 18 },
  cardGroup: { gap: 18 },
  sign: { width: 54, height: 54, borderRadius: 13, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 39, letterSpacing: -1.4 },
  valueRow: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", columnGap: 8 },
  value: { letterSpacing: -2, flexShrink: 1 },
  unit: { fontSize: 24 },
  detail: { fontSize: 17 },
  mascot: { alignSelf: "center", marginTop: 12 },
  rail: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24 },
  railLine: { position: "absolute", height: 3, left: 5, right: 5, transformOrigin: "left" },
  station: { width: 14, height: 14, borderWidth: 2, borderRadius: 7 },
  footer: { flexDirection: "row", alignItems: "center", gap: 12, padding: 18 },
  action: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, minHeight: 50, borderRadius: 25, paddingHorizontal: 16 },
  actionText: { fontSize: 17 },
  center: { alignItems: "center", justifyContent: "center", gap: 20 },
  link: { fontSize: 17, padding: 8 },
});
