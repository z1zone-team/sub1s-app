import { useState, useRef, useCallback, useEffect } from "react";
import { createSpeechDetector, SPEECH_SAMPLE_MS } from "@/features/voice/speechLevel";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder as useExpoAudioRecorder,
} from "expo-audio";

export const MAX_RECORDING_DURATION_MS = 30_000; // 최대 30초
export const MAX_AUDIO_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 최대 5MB

export interface AudioRecordingResult {
  uri: string;
  durationMillis: number;
  fileSizeBytes?: number;
}

export function useAudioRecorder() {
  // 입력 크기(metering)를 읽어 말소리가 들어올 때만 파형이 움직이게 한다
  const recorder = useExpoAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [durationMillis, setDurationMillis] = useState<number>(0);
  const [recordingResult, setRecordingResult] = useState<AudioRecordingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startedAtRef = useRef<number>(0);
  const activeRef = useRef<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const meterTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detectorRef = useRef(createSpeechDetector());

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (meterTimerRef.current) {
      clearInterval(meterTimerRef.current);
      meterTimerRef.current = null;
    }
    detectorRef.current.reset();
    setIsSpeaking(false);
  }, []);

  const stopRecording = useCallback(async (): Promise<AudioRecordingResult | null> => {
    clearTimer();
    if (!activeRef.current) {
      setIsRecording(false);
      return null;
    }
    activeRef.current = false;

    try {
      const measured = Math.round(recorder.currentTime * 1000);
      await recorder.stop();
      const uri = recorder.uri;
      setIsRecording(false);

      if (!uri) {
        setError("NO_RECORDING_URI");
        return null;
      }

      const result: AudioRecordingResult = {
        uri,
        durationMillis: measured > 0 ? measured : Date.now() - startedAtRef.current,
      };
      setRecordingResult(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop recording");
      setIsRecording(false);
      return null;
    }
  }, [clearTimer, recorder]);

  const startRecording = useCallback(async (): Promise<boolean> => {
    setError(null);
    setRecordingResult(null);
    setDurationMillis(0);

    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setError("AUDIO_PERMISSION_DENIED");
        return false;
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

      await recorder.prepareToRecordAsync();
      recorder.record();

      activeRef.current = true;
      startedAtRef.current = Date.now();
      setIsRecording(true);

      // 입력 크기만 따로 자주 읽는다. 말하는 중인지가 바뀔 때만 상태를 바꿔 화면이 불필요하게 다시 그려지지 않는다
      detectorRef.current.reset();
      meterTimerRef.current = setInterval(() => {
        const speaking = detectorRef.current.update(recorder.getStatus().metering, Date.now());
        setIsSpeaking((previous) => (previous === speaking ? previous : speaking));
      }, SPEECH_SAMPLE_MS);

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startedAtRef.current;
        setDurationMillis(elapsed);

        // 30초 초과 시 자동 중지
        if (elapsed >= MAX_RECORDING_DURATION_MS) {
          void stopRecording();
        }
      }, 200);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start recording");
      setIsRecording(false);
      activeRef.current = false;
      clearTimer();
      return false;
    }
  }, [clearTimer, recorder, stopRecording]);

  useEffect(() => {
    return () => {
      clearTimer();
      if (activeRef.current) {
        activeRef.current = false;
        void recorder.stop().catch(() => undefined);
      }
    };
  }, [clearTimer, recorder]);

  return {
    isRecording,
    /** 녹음 중 마이크로 말소리가 들어오고 있는지. 조용하면 false */
    isSpeaking,
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
