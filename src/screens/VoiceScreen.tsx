import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  useVoiceRouteRecommendMutation,
  type VoiceRouteRecommendResponseDto,
} from "@/apis/mutations/voice/useVoiceRouteRecommendMutation";
import { Button } from "@/common/components/Button";
import { Icon } from "@/common/components/Icon";
import { LoginRequired } from "@/common/components/LoginRequired";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { useAudioRecorder, type AudioRecordingResult } from "@/common/device/audio/useAudioRecorder";
import { cn } from "@/lib/cn";
import { MODE_TITLE } from "@/features/routing/routeView";
import {
  endpointsOfOption,
  failureOf,
  FAILURE_TEXT,
  MIN_SPEECH_MS,
  modeReasonText,
  VOICE_EXAMPLES,
  type VoiceFailure,
} from "@/features/voice/voiceView";
import type { RootStackParamList } from "@/navigation/navigation-types";

type Phase =
  | { name: "listening" }
  | { name: "processing" }
  | { name: "result"; data: VoiceRouteRecommendResponseDto }
  | { name: "failed"; failure: VoiceFailure };

function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}초`;
}

export function VoiceScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "Voice">) {
  const { isSignedIn } = useAuth();
  const recorder = useAudioRecorder();
  const recommend = useVoiceRouteRecommendMutation();
  const [phase, setPhase] = useState<Phase>({ name: "listening" });
  const started = useRef(false);

  const submit = useCallback(
    (recording: AudioRecordingResult) => {
      if (recording.durationMillis < MIN_SPEECH_MS) {
        setPhase({ name: "failed", failure: "NO_SPEECH" });
        return;
      }
      setPhase({ name: "processing" });
      recommend.mutate(
        { audio: { uri: recording.uri, name: "voice_query.m4a", type: "audio/m4a" } },
        {
          onSuccess: (data) => setPhase({ name: "result", data }),
          onError: (error) => setPhase({ name: "failed", failure: failureOf(error) }),
        }
      );
    },
    [recommend]
  );

  const listen = useCallback(async () => {
    setPhase({ name: "listening" });
    recorder.reset();
    const ok = await recorder.startRecording();
    if (!ok) setPhase({ name: "failed", failure: "GENERIC" });
  }, [recorder]);

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

  if (!isSignedIn) {
    return <LoginRequired edges={[]} description={FAILURE_TEXT.LOGIN.body} />;
  }

  if (phase.name === "failed") {
    const failure =
      recorder.error === "AUDIO_PERMISSION_DENIED"
        ? { title: "마이크 권한이 필요해요", body: "설정에서 마이크 사용을 허용한 뒤 다시 시도해 주세요." }
        : FAILURE_TEXT[phase.failure];
    return (
      <Screen edges={[]} contentClassName="items-center justify-center gap-4 px-6">
        <Text className="text-title-lg font-sans-extrabold">{failure.title}</Text>
        <Text className="text-center text-text-secondary">{failure.body}</Text>
        {phase.failure === "NO_SPEECH" || phase.failure === "NOT_FOUND" ? (
          <View className="gap-1">
            {VOICE_EXAMPLES.map((example) => (
              <Text key={example} className="text-center text-body text-text-secondary">
                “{example}”
              </Text>
            ))}
          </View>
        ) : null}
        <View className="w-full gap-2 pt-2">
          <Button label="재시도" onPress={() => void listen()} />
          <Button label="글자로 검색하기" variant="ghost" onPress={() => navigation.replace("Search")} />
        </View>
      </Screen>
    );
  }

  if (phase.name === "result") {
    const { data } = phase;
    const endpoints = endpointsOfOption(data.recommendedRoute);
    return (
      <Screen edges={[]} scroll contentClassName="gap-4 px-6 pt-6">
        <View className="gap-1">
          <Text className="text-body-sm text-text-secondary">이렇게 들었어요</Text>
          <Text className="text-heading font-sans-bold">“{data.transcript}”</Text>
        </View>

        <View className="flex-row items-center gap-3">
          <Text className="rounded-pill bg-surface px-3 py-1.5 text-body font-sans-bold">
            {data.interpretedIntent.originStationName}
          </Text>
          <Text className="text-text-secondary">→</Text>
          <Text className="rounded-pill bg-surface px-3 py-1.5 text-body font-sans-bold">
            {data.interpretedIntent.destStationName}
          </Text>
        </View>

        <View className="gap-2 rounded-lg bg-surface p-4">
          <Text className="text-body-sm font-sans-bold text-primary">
            {modeReasonText(data.interpretedIntent.preferredMode)}
          </Text>
          <Text className="text-body">{data.briefingText}</Text>
        </View>

        <View className="gap-2 pt-2">
          <Button
            label="경로 보기"
            disabled={!endpoints}
            onPress={() => {
              if (!endpoints) return;
              navigation.replace("RouteDetail", {
                ...endpoints,
                option: data.recommendedRoute,
                title: MODE_TITLE[data.recommendedRoute.mode],
                tagline: data.briefingText,
              });
            }}
          />
          <Button label="다시 말하기" variant="secondary" onPress={() => void listen()} />
        </View>
      </Screen>
    );
  }

  const processing = phase.name === "processing";
  return (
    <Screen edges={[]} contentClassName="items-center justify-center gap-6 px-6">
      <Text className="text-body-sm text-text-secondary">{processing ? "분석하는 중이에요" : "듣고 있어요"}</Text>
      <Text className="text-headline font-sans-extrabold">어디로 갈까요?</Text>
      <Text className="text-body text-text-secondary">예) “{VOICE_EXAMPLES[0]}”</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="녹음 중지"
        disabled={processing}
        onPress={() => void stop()}
        className={cn(
          "h-24 w-24 items-center justify-center rounded-pill bg-primary",
          processing && "opacity-50"
        )}
      >
        {processing ? <Icon name="ellipsis-horizontal" size={32} tone="onPrimary" /> : <Icon name="stop" size={32} tone="onPrimary" />}
      </Pressable>

      <Text className="text-body-sm text-text-secondary">
        {processing ? "잠시만 기다려 주세요" : `${formatSeconds(recorder.durationMillis)} · 누르면 중지`}
      </Text>
    </Screen>
  );
}
