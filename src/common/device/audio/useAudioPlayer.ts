import { useState, useRef, useCallback, useEffect } from "react";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [positionMillis, setPositionMillis] = useState<number>(0);
  const [durationMillis, setDurationMillis] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const playerRef = useRef<AudioPlayer | null>(null);
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);

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

  const playAudio = useCallback(
    async (sourceUri: string): Promise<boolean> => {
      setError(null);
      try {
        unloadSound();

        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });

        const player = createAudioPlayer({ uri: sourceUri });
        playerRef.current = player;

        subscriptionRef.current = player.addListener("playbackStatusUpdate", (status) => {
          setIsPlaying(status.playing);
          setPositionMillis(Math.round(status.currentTime * 1000));
          setDurationMillis(Math.round(status.duration * 1000));
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPositionMillis(0);
          }
        });

        player.play();
        setIsPlaying(true);
        return true;
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
