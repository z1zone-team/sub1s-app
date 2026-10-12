import { useCallback, useEffect, useRef, useState } from "react";
import * as Speech from "expo-speech";
import { useAudioPlayer } from "@/common/device/audio/useAudioPlayer";
import { ENV } from "@/constants/env";
import { useAuthToken } from "@/hooks/useAuthToken";
import { playBriefing, resolveTtsUrl, type BriefingSource } from "../briefingVoice";

const DEVICE_VOICE_LANGUAGE = "ko-KR";

/**
 * 브리핑 읽어 주기. 서버 음성(TTS)을 먼저 시도하고 안 되면 기기 내장 음성으로 읽는다.
 * 서버 음성은 로그인이 필요해서 요청에 토큰 헤더를 붙인다
 */
export function useBriefingVoice() {
  const player = useAudioPlayer();
  const { getToken } = useAuthToken();
  const [speaking, setSpeaking] = useState(false);
  const busy = useRef(false);
  /** 서버 음성이 실패한 음성 경로. 같은 결과에서 다시 누르면 서버를 기다리지 않고 기기 음성으로 읽는다 */
  const serverFailedFor = useRef<string | null>(null);

  const stopDevice = useCallback(() => {
    void Speech.stop();
    setSpeaking(false);
  }, []);

  const stop = useCallback(() => {
    void player.stopAudio();
    stopDevice();
  }, [player, stopDevice]);

  const speakDevice = useCallback((text: string) => {
    Speech.speak(text, {
      language: DEVICE_VOICE_LANGUAGE,
      onStart: () => setSpeaking(true),
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
    setSpeaking(true);
  }, []);

  const toggle = useCallback(
    async (source: BriefingSource) => {
      if (busy.current) return;
      if (player.isPlaying) {
        await player.pauseAudio();
        return;
      }
      if (speaking) {
        stopDevice();
        return;
      }

      busy.current = true;
      const key = source.audioTtsUrl ?? "";
      try {
        await playBriefing(
          source,
          {
            playServer: async (url) => {
              try {
                const token = await getToken();
                const started = await player.playAudio(
                  resolveTtsUrl(url, ENV.API_BASE_URL),
                  token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
                );
                if (!started) serverFailedFor.current = key;
                return started;
              } catch {
                serverFailedFor.current = key;
                return false;
              }
            },
            speakDevice,
          },
          serverFailedFor.current === key
        );
      } finally {
        busy.current = false;
      }
    },
    [getToken, player, speakDevice, speaking, stopDevice]
  );

  // 화면을 벗어나면 읽던 것을 멈춘다 (서버 음성은 플레이어가 스스로 정리한다)
  useEffect(
    () => () => {
      void Speech.stop();
    },
    []
  );

  return { isPlaying: player.isPlaying || speaking, toggle, stop };
}
