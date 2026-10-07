import { useState, useRef, useCallback, useEffect } from "react";
import { Audio, AVPlaybackStatus } from "expo-av";

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [positionMillis, setPositionMillis] = useState<number>(0);
  const [durationMillis, setDurationMillis] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const soundRef = useRef<Audio.Sound | null>(null);

  const unloadSound = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch {
        // ignore
      }
      soundRef.current = null;
    }
    setIsPlaying(false);
    setPositionMillis(0);
    setDurationMillis(0);
  }, []);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        setError(status.error);
      }
      setIsPlaying(false);
      return;
    }

    setIsPlaying(status.isPlaying);
    setPositionMillis(status.positionMillis);
    setDurationMillis(status.durationMillis ?? 0);

    if (status.didJustFinish) {
      setIsPlaying(false);
      setPositionMillis(0);
    }
  }, []);

  const playAudio = useCallback(
    async (sourceUri: string): Promise<boolean> => {
      setError(null);
      try {
        await unloadSound();

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: sourceUri },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );

        soundRef.current = sound;
        setIsPlaying(true);
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to play audio";
        setError(msg);
        setIsPlaying(false);
        return false;
      }
    },
    [unloadSound, onPlaybackStatusUpdate]
  );

  const pauseAudio = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to pause audio";
        setError(msg);
      }
    }
  }, []);

  const stopAudio = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        setIsPlaying(false);
        setPositionMillis(0);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to stop audio";
        setError(msg);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      void unloadSound();
    };
  }, [unloadSound]);

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
