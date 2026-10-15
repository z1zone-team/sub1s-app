import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useAuth } from "@clerk/expo";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  isDestinationConfirm,
  isOriginConfirm,
  type VoiceDestinationCandidateDto,
  type VoiceRouteRecommendResponseDto,
} from "@/apis/mutations/voice/voiceRouteTypes";
import { DesignIcon } from "@/common/components/DesignIcon";
import { LineBadge } from "@/common/components/LineBadge";
import { LoginRequired } from "@/common/components/LoginRequired";
import { RiseIn } from "@/common/components/RiseIn";
import { Screen } from "@/common/components/Screen";
import { Shake } from "@/common/components/Shake";
import { Text } from "@/common/components/Text";
import { useAudioRecorder, type AudioRecordingResult } from "@/common/device/audio/useAudioRecorder";
import { getCurrentCoordinates } from "@/common/device/location/getCurrentCoordinates";
import { canSpeakBriefing } from "@/features/voice/briefingVoice";
import { BriefingCard } from "@/features/voice/components/BriefingCard";
import { useBriefingVoice } from "@/features/voice/hooks/useBriefingVoice";
import { useVoiceJobMutation } from "@/features/voice/hooks/useVoiceJobMutation";
import { MicButton } from "@/features/voice/components/MicButton";
import { VoiceFailMascot } from "@/features/voice/components/VoiceFailMascot";
import { WaveBars } from "@/features/voice/components/WaveBars";
import { MODE_TITLE } from "@/features/routing/routeView";
import { useRecentDestinations } from "@/features/routing/useRecentDestinations";
import { saveVoiceDestination } from "@/features/voice/saveVoiceDestination";
import {
  candidateAddress,
  candidateNearestText,
  confirmStepOf,
  confirmTitle,
  destinationLineId,
  endpointsOfOption,
  failureOf,
  FAILURE_TEXT,
  MIN_SPEECH_MS,
  modeLabel,
  pickCandidate,
  VOICE_EXAMPLES,
  type ConfirmStep,
  type VoiceFailure,
} from "@/features/voice/voiceView";
import type { RootStackParamList } from "@/navigation/navigation-types";

type Phase =
  | { name: "listening" }
  | { name: "processing" }
  | { name: "result"; data: VoiceRouteRecommendResponseDto }
  | { name: "confirm"; transcript: string; step: ConfirmStep }
  | { name: "failed"; failure: VoiceFailure };

/** 세 상태(듣는 중, 결과, 실패)가 함께 쓰는 위쪽 줄: 닫기, 가운데 제목 */
function VoiceHeader({ onClose }: { onClose: () => void }) {
  return (
    <View className="flex-row items-center justify-between px-4 pt-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="닫기"
        onPress={onClose}
        className="h-control w-control items-center justify-center"
      >
        <DesignIcon name="close" size={22} strokeWidth={2} />
      </Pressable>
      <Text className="text-subtitle font-sans-bold">음성 검색</Text>
      <View className="w-control" />
    </View>
  );
}

/** 프로토타입 Voice.dc.html, VoiceFail.dc.html. 듣는 중과 분석 중, 결과, 실패를 한 화면에서 바꿔 보여 준다 */
export function VoiceScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "Voice">) {
  const { isSignedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const recorder = useAudioRecorder();
  const recommend = useVoiceJobMutation();
  const briefingVoice = useBriefingVoice();
  const { addDestination } = useRecentDestinations();
  const [phase, setPhase] = useState<Phase>({ name: "listening" });
  const started = useRef(false);
  const mounted = useRef(true);
  const close = () => navigation.goBack();
  const bottomPadding = Math.max(insets.bottom, 12) + 10;

  const submit = useCallback(
    (recording: AudioRecordingResult) => {
      if (recording.durationMillis < MIN_SPEECH_MS) {
        setPhase({ name: "failed", failure: "NO_SPEECH" });
        return;
      }
      setPhase({ name: "processing" });
      // 출발지를 말하지 않아도 되도록 현재 위치를 함께 보낸다. 위치를 얻지 못하면 위치 없이 보낸다
      void getCurrentCoordinates().then((coords) => {
        if (!mounted.current) return; // 위치를 기다리는 동안 화면을 닫았으면 보내지 않는다
        recommend.mutate(
          { audio: { uri: recording.uri, name: "voice_query.m4a", type: "audio/m4a" }, ...coords },
          {
            onSuccess: (data) => {
              // 출발지나 도착지 후보가 여럿이면 경로 대신 "이 곳이 맞나요?"를 묻는다
              if (isDestinationConfirm(data) || isOriginConfirm(data)) {
                const step = confirmStepOf(data);
                setPhase(step ? { name: "confirm", transcript: data.transcript, step } : { name: "failed", failure: "GENERIC" });
                return;
              }
              void saveVoiceDestination(data, addDestination);
              setPhase({ name: "result", data });
            },
            onError: (error) => setPhase({ name: "failed", failure: failureOf(error) }),
          }
        );
      });
    },
    [recommend, addDestination]
  );

  const listen = useCallback(async () => {
    briefingVoice.stop();
    setPhase({ name: "listening" });
    recorder.reset();
    const ok = await recorder.startRecording();
    if (!ok) setPhase({ name: "failed", failure: "GENERIC" });
  }, [recorder, briefingVoice]);

  useEffect(() => {
    mounted.current = true; // 개발 모드는 효과를 한 번 해제했다가 다시 실행한다
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn || started.current) return;
    started.current = true;
    void listen();
  }, [isSignedIn, listen]);

  // 30초 제한으로 녹음이 저절로 끝나면 그 녹음을 보낸다
  useEffect(() => {
    if (phase.name === "listening" && !recorder.isRecording && recorder.recordingResult) {
      submit(recorder.recordingResult);
    }
  }, [phase.name, recorder.isRecording, recorder.recordingResult, submit]);

  const stop = async () => {
    const recording = await recorder.stopRecording();
    if (!recording) {
      setPhase({ name: "failed", failure: "NO_SPEECH" });
      return;
    }
    submit(recording);
  };

  // 후보를 고르면 두 지점이 다 정해졌을 때 경로를 찾고, 도착이 더 남았으면 이어서 묻는다
  const choose = (phase: Extract<Phase, { name: "confirm" }>, candidate: VoiceDestinationCandidateDto) => {
    const outcome = pickCandidate(phase.step, candidate);
    if (!outcome) {
      setPhase({ name: "failed", failure: "GENERIC" });
      return;
    }
    if (outcome.kind === "next") {
      setPhase({ name: "confirm", transcript: phase.transcript, step: outcome.step });
      return;
    }
    void addDestination(outcome.destination);
    navigation.replace("RouteResult", { origin: outcome.origin, destination: outcome.destination, mode: phase.step.mode });
  };

  if (!isSignedIn) {
    return (
      <Screen>
        <VoiceHeader onClose={close} />
        <LoginRequired edges={[]} description={FAILURE_TEXT.LOGIN.body} />
      </Screen>
    );
  }

  if (phase.name === "failed") {
    const failure =
      recorder.error === "AUDIO_PERMISSION_DENIED"
        ? { title: "마이크 권한이 필요해요", body: "설정에서 마이크 사용을 허용한 뒤 다시 시도해 주세요." }
        : FAILURE_TEXT[phase.failure];
    const showExamples =
      phase.failure === "NO_SPEECH" || phase.failure === "NOT_FOUND" || phase.failure === "ORIGIN_REQUIRED";
    return (
      <Screen>
        <VoiceHeader onClose={close} />
        <View className="flex-1 items-center justify-center px-7 pb-20">
          <Shake delayMs={200}>
            <VoiceFailMascot size={120} />
          </Shake>
          <Text className="mt-7 text-center text-display-sm font-sans-bold">{failure.title}</Text>
          <Text className="mt-2.5 text-center text-subtitle text-text-secondary">{failure.body}</Text>
          {showExamples ? (
            <View className="mt-6 flex-row flex-wrap justify-center gap-2">
              {VOICE_EXAMPLES.map((example) => (
                <View key={example} className="h-8.5 justify-center rounded-pill bg-surface px-3.5">
                  <Text className="text-body-sm font-sans-semibold">“{example}”</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        <View style={{ paddingBottom: bottomPadding }} className="gap-2 px-5">
          <Pressable
            accessibilityRole="button"
            onPress={() => void listen()}
            className="h-14 flex-row items-center justify-center gap-2 rounded-lg bg-primary"
          >
            <DesignIcon name="retry" size={20} tone="onPrimary" />
            <Text className="text-base font-sans-bold text-on-primary">재시도</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.replace("Search")}
            className="h-13 items-center justify-center rounded-md-plus border border-border"
          >
            <Text className="text-subtitle font-sans-semibold">글자로 찾기</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (phase.name === "confirm") {
    const { transcript, step } = phase;
    return (
      <Screen>
        <VoiceHeader onClose={close} />
        <View className="flex-1 px-5 pt-10">
          <RiseIn from={8} durationMs={400}>
            <View className="items-center px-2">
              <Text className="text-subtitle font-sans-medium text-text-secondary">{confirmTitle(step.question)}</Text>
              <Text className="mt-3 text-center text-display-sm font-sans-bold leading-snug">“{transcript}”</Text>
            </View>
          </RiseIn>
          <ScrollView className="mt-6" contentContainerClassName="gap-2 pb-4" showsVerticalScrollIndicator={false}>
            {step.candidates.map((candidate, index) => {
              const nearest = candidateNearestText(candidate);
              return (
                <Pressable
                  key={`${candidate.type}-${candidate.stationId ?? candidate.name}-${index}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${candidate.name}, ${candidateAddress(candidate)}`}
                  onPress={() => choose(phase, candidate)}
                  className="rounded-md-plus border border-border bg-bg px-4 py-3.5"
                >
                  <Text className="text-body font-sans-bold">{candidate.name}</Text>
                  {candidateAddress(candidate) ? (
                    <Text className="mt-0.5 text-body-sm text-text-secondary">{candidateAddress(candidate)}</Text>
                  ) : null}
                  {nearest ? <Text className="mt-0.5 text-body-sm text-primary">{nearest}</Text> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        <View style={{ paddingBottom: bottomPadding }} className="gap-2 px-5">
          <Pressable
            accessibilityRole="button"
            onPress={() => void listen()}
            className="h-14 flex-row items-center justify-center gap-2 rounded-lg bg-primary"
          >
            <DesignIcon name="retry" size={20} tone="onPrimary" />
            <Text className="text-base font-sans-bold text-on-primary">다시 말하기</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.replace("Search")}
            className="h-13 items-center justify-center rounded-md-plus border border-border"
          >
            <Text className="text-subtitle font-sans-semibold">글자로 찾기</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (phase.name === "result") {
    const { data } = phase;
    const endpoints = endpointsOfOption(data.recommendedRoute);
    const lineId = destinationLineId(data.recommendedRoute);
    // 서버 음성이 없거나 실패해도 기기 음성으로 읽을 수 있어서 문장이 있으면 재생할 수 있다
    const canPlay = canSpeakBriefing(data);
    return (
      <Screen>
        <VoiceHeader onClose={close} />
        <View className="flex-1 items-center px-7 pt-14">
          <RiseIn from={8} durationMs={400}>
            <View className="items-center">
              <Text className="text-subtitle font-sans-medium text-text-secondary">이렇게 들었어요</Text>
              <Text className="mt-3 text-center text-display-sm font-sans-bold leading-snug">“{data.transcript}”</Text>
              <View className="mt-5 h-9 flex-row items-center gap-2 rounded-pill bg-surface px-3.5">
                <View className="h-1.5 w-1.5 rounded-pill border-2 border-text" />
                <Text className="text-body font-sans-semibold">{data.interpretedIntent.originStationName}</Text>
                <DesignIcon name="arrow" size={14} tone="secondary" />
                <Text className="text-body font-sans-semibold">{data.interpretedIntent.destStationName}</Text>
                {lineId ? <LineBadge lineId={lineId} size="sm" /> : null}
              </View>
              <Text className="mt-3.5 text-center text-body text-text-secondary">
                <Text className="text-body font-sans-bold text-primary">{modeLabel(data.interpretedIntent.preferredMode)}</Text>로 찾았어요
              </Text>
              <BriefingCard
                text={data.briefingText}
                playing={briefingVoice.isPlaying}
                canPlay={canPlay}
                onToggle={() => void briefingVoice.toggle(data)}
              />
            </View>
          </RiseIn>
          <View className="mt-16">
            <WaveBars active={false} />
          </View>
        </View>
        <View style={{ paddingBottom: bottomPadding }} className="gap-2 px-5">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !endpoints }}
            disabled={!endpoints}
            onPress={() => {
              if (!endpoints) return;
              briefingVoice.stop();
              navigation.replace("RouteDetail", {
                ...endpoints,
                option: data.recommendedRoute,
                title: MODE_TITLE[data.recommendedRoute.mode],
                tagline: data.briefingText,
              });
            }}
            className={endpoints ? "h-14 items-center justify-center rounded-lg bg-primary" : "h-14 items-center justify-center rounded-lg bg-primary opacity-50"}
          >
            <Text className="text-base font-sans-bold text-on-primary">경로 보기</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => void listen()}
            className="h-13 items-center justify-center rounded-md-plus border border-border bg-bg"
          >
            <Text className="text-subtitle font-sans-semibold">다시 말하기</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const processing = phase.name === "processing";
  return (
    <Screen>
      <VoiceHeader onClose={close} />
      <View className="flex-1 items-center px-7 pt-14">
        <Text className="text-subtitle font-sans-medium text-text-secondary">{processing ? "분석하는 중이에요" : "듣고 있어요"}</Text>
        <Text className="mt-3 text-center text-display-sm font-sans-bold leading-snug">어디로 갈까요?</Text>
        <Text className="mt-2.5 text-center text-body text-text-secondary">예) “{VOICE_EXAMPLES[0]}”</Text>
        <View className="mt-16">
          {/* 듣는 중이라도 말소리가 들어올 때만 움직인다. 조용하거나 분석 중이면 멈춘 회색 막대 */}
          <WaveBars active={!processing && recorder.isSpeaking} />
        </View>
      </View>
      <View style={{ paddingBottom: bottomPadding }} className="items-center gap-3.5 px-5">
        <MicButton onPress={() => void stop()} disabled={processing} />
        <Text className="text-body-sm text-text-secondary">
          {processing ? "잠시만 기다려 주세요" : "다 말씀하셨으면 눌러 주세요"}
        </Text>
      </View>
    </Screen>
  );
}
