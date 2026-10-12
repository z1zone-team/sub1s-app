import { useState, useRef, useCallback, useEffect } from "react";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";

/** 원격 오디오가 이 시간 안에 불러지지 않으면 실패로 본다 (서버 TTS 합성 15초 제한보다 짧게 두어 대체 음성이 늦지 않게 한다) */
export const AUDIO_LOAD_TIMEOUT_MS = 8000;

export interface PlayAudioOptions {
  /** 원격 오디오 요청에 붙일 헤더(로그인이 필요한 서버 경로용) */
  headers?: Record<string, string>;
}

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [positionMillis, setPositionMillis] = useState<number>(0);
  const [durationMillis, setDurationMillis] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const playerRef = useRef<AudioPlayer | null>(null);
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);
  /** 가장 최근 재생 요청의 번호. 이전 요청의 늦은 실패가 새 재생을 정리하지 못하게 한다 */
  const playIdRef = useRef(0);

  const unloadSound = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    if (playerRef.current) {
      try {
        playerRef.current.remove();
      } catch {
        // ignore
      }
      playerRef.current = null;
    }
    setIsPlaying(false);
    setPositionMillis(0);
    setDurationMillis(0);
  }, []);

  /**
   * 오디오를 재생한다. 재생이 시작되면 true, 불러오지 못하거나(서버 오류, 네트워크) 시간 안에 시작하지 못하면 false.
   * 호출한 쪽이 실패를 알아야 대체 수단(기기 음성)으로 넘어갈 수 있어서 시작 여부가 정해질 때까지 기다린다
   */
  const playAudio = useCallback(
    async (sourceUri: string, options?: PlayAudioOptions): Promise<boolean> => {
      setError(null);
      try {
        const playId = ++playIdRef.current;
        unloadSound();

        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });

        const player = createAudioPlayer(
          options?.headers ? { uri: sourceUri, headers: options.headers } : { uri: sourceUri }
        );
        playerRef.current = player;

        return await new Promise<boolean>((resolve) => {
          let settled = false;
          const settle = (ok: boolean, message?: string) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (!ok && playIdRef.current === playId) {
              setError(message ?? "Failed to play audio");
              unloadSound();
            }
            resolve(ok);
          };
          const timer = setTimeout(() => settle(false, "AUDIO_LOAD_TIMEOUT"), AUDIO_LOAD_TIMEOUT_MS);

          subscriptionRef.current = player.addListener("playbackStatusUpdate", (status) => {
            if (status.error) {
              settle(false, status.error);
              return;
            }
            setIsPlaying(status.playing);
            setPositionMillis(Math.round(status.currentTime * 1000));
            setDurationMillis(Math.round(status.duration * 1000));
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPositionMillis(0);
            }
            if (status.isLoaded) settle(true);
          });

          player.play();
          setIsPlaying(true);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to play audio");
        setIsPlaying(false);
        return false;
      }
    },
    [unloadSound]
  );

  const pauseAudio = useCallback(async () => {
    try {
      playerRef.current?.pause();
      setIsPlaying(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pause audio");
    }
  }, []);

  const stopAudio = useCallback(async () => {
    try {
      const player = playerRef.current;
      if (player) {
        player.pause();
        await player.seekTo(0);
      }
      setIsPlaying(false);
      setPositionMillis(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop audio");
    }
  }, []);

  useEffect(() => unloadSound, [unloadSound]);

  return {
    isPlaying,
    positionMillis,
    durationMillis,
    error,
    playAudio,
    pauseAudio,
    stopAudio,
  };
}
