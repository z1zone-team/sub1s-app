import { useState, useRef, useCallback, useEffect } from "react";
import { Audio } from "expo-av";

export const MAX_RECORDING_DURATION_MS = 30_000; // 최대 30초
export const MAX_AUDIO_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 최대 5MB

export interface AudioRecordingResult {
  uri: string;
  durationMillis: number;
  fileSizeBytes?: number;
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [durationMillis, setDurationMillis] = useState<number>(0);
  const [recordingResult, setRecordingResult] = useState<AudioRecordingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<AudioRecordingResult | null> => {
    clearTimer();
    const recording = recordingRef.current;
    if (!recording) {
      setIsRecording(false);
      return null;
    }

    try {
      const status = await recording.getStatusAsync();
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      recordingRef.current = null;
      setIsRecording(false);

      if (!uri) {
        setError("NO_RECORDING_URI");
        return null;
      }

      const result: AudioRecordingResult = {
        uri,
        durationMillis: status.durationMillis,
      };

      setRecordingResult(result);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to stop recording";
      setError(msg);
      setIsRecording(false);
      recordingRef.current = null;
      return null;
    }
  }, [clearTimer]);

  const startRecording = useCallback(async (): Promise<boolean> => {
    setError(null);
    setRecordingResult(null);
    setDurationMillis(0);

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setError("AUDIO_PERMISSION_DENIED");
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;
      setIsRecording(true);

      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setDurationMillis(elapsed);

        // 30초 초과 시 자동 중지
        if (elapsed >= MAX_RECORDING_DURATION_MS) {
          void stopRecording();
        }
      }, 200);

      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start recording";
      setError(msg);
      setIsRecording(false);
      clearTimer();
      return false;
    }
  }, [clearTimer, stopRecording]);

  useEffect(() => {
    return () => {
      clearTimer();
      if (recordingRef.current) {
        void recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [clearTimer]);

  return {
    isRecording,
    durationMillis,
    recordingResult,
    error,
    startRecording,
    stopRecording,
    reset: () => {
      setError(null);
      setRecordingResult(null);
      setDurationMillis(0);
    },
  };
}
