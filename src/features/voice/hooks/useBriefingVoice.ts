import { useCallback, useEffect, useState } from "react";
import * as Speech from "expo-speech";
import { canSpeakBriefing, type BriefingSource } from "../briefingVoice";

const DEVICE_VOICE_LANGUAGE = "ko-KR";

/** 브리핑 읽어 주기. 기기 내장 음성으로 읽는다 */
export function useBriefingVoice() {
  const [speaking, setSpeaking] = useState(false);

  const stop = useCallback(() => {
    void Speech.stop();
    setSpeaking(false);
  }, []);

  const toggle = useCallback(
    async (source: BriefingSource) => {
      if (speaking) {
        stop();
        return;
      }
      if (!canSpeakBriefing(source)) return;

      Speech.speak(source.briefingText.trim(), {
        language: DEVICE_VOICE_LANGUAGE,
        onStart: () => setSpeaking(true),
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
      setSpeaking(true);
    },
    [speaking, stop]
  );

  // 화면을 벗어나면 읽던 것을 멈춘다
  useEffect(
    () => () => {
      void Speech.stop();
    },
    []
  );

  return { isPlaying: speaking, toggle, stop };
}
