import { useCallback, useRef, useState } from "react";
import {
  AudioEncodingAndroid,
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  type ExpoSpeechRecognitionOptions,
} from "expo-speech-recognition";
import {
  classifySpeechError,
  timingOf,
  transcriptOf,
  volumeToLevel,
  type SpeechOutcome,
} from "./speechRecognition";

/** 이 기기에서 음성 인식 서비스를 쓸 수 있는지. 네이티브 모듈이 없는 빌드(예: Expo Go)면 false */
export function isDeviceSpeechAvailable(): boolean {
  try {
    return ExpoSpeechRecognitionModule.isRecognitionAvailable();
  } catch {
    return false;
  }
}

export interface SpeechStartOptions {
  /** 마이크 대신 이 오디오 파일을 받아 적는다(Android 13+, iOS). 개발 빌드의 측정용 */
  audioUri?: string;
}

/**
 * 기기 음성 인식(Android SpeechRecognizer, iOS Speech). 말하는 동안 중간 결과를 주고,
 * 말이 끝나면(또는 `stop`) 마지막 결과로 `outcome`을 채운다. 음성 합성(expo-speech)처럼 서버를 쓰지 않는다
 */
export function useSpeechRecognizer() {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [level, setLevel] = useState(0);
  const [outcome, setOutcome] = useState<SpeechOutcome | null>(null);
  const startedAt = useRef(0);
  const speechEndedAt = useRef<number | null>(null);
  const finalText = useRef("");
  const settled = useRef(false);

  const finish = useCallback((next: SpeechOutcome) => {
    if (settled.current) return;
    settled.current = true;
    setListening(false);
    setLevel(0);
    setOutcome(next);
  }, []);

  useSpeechRecognitionEvent("result", (event) => {
    const text = transcriptOf(event);
    setInterim(text);
    if (event.isFinal && text) finalText.current = text;
  });
  useSpeechRecognitionEvent("speechend", () => {
    speechEndedAt.current = Date.now();
  });
  useSpeechRecognitionEvent("audioend", () => {
    speechEndedAt.current ??= Date.now();
  });
  useSpeechRecognitionEvent("volumechange", (event) => setLevel(volumeToLevel(event.value)));
  useSpeechRecognitionEvent("error", (event) => {
    if (__DEV__) console.log(`[voice-timing] device recognition error ${event.error}: ${event.message}`);
    // 최종 결과를 받은 뒤의 오류(Android가 끝에 no-speech를 주기도 한다)는 결과를 그대로 쓴다
    if (finalText.current) return;
    finish(classifySpeechError(event.error));
  });
  useSpeechRecognitionEvent("end", () => {
    const text = finalText.current;
    if (text) {
      finish({ kind: "text", transcript: text, timing: timingOf(startedAt.current, speechEndedAt.current, Date.now()) });
    } else {
      finish({ kind: "no-speech" });
    }
  });

  const reset = useCallback(() => {
    settled.current = false;
    finalText.current = "";
    speechEndedAt.current = null;
    setInterim("");
    setLevel(0);
    setOutcome(null);
  }, []);

  /** 듣기를 시작한다. 권한이 없거나 시작하지 못하면 false이고 `outcome`에 이유가 담긴다 */
  const start = useCallback(
    async (options: SpeechStartOptions = {}): Promise<boolean> => {
      reset();
      try {
        const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!permission.granted) {
          finish({ kind: "permission-denied" });
          return false;
        }
        const startOptions: ExpoSpeechRecognitionOptions = {
          lang: "ko-KR",
          interimResults: true,
          continuous: false,
          maxAlternatives: 1,
          // 짧은 명령형 문장에는 Android의 web_search 모델이 free_form보다 잘 끝맺는다(라이브러리 안내)
          androidIntentOptions: { EXTRA_LANGUAGE_MODEL: "web_search" },
          volumeChangeEventOptions: { enabled: !options.audioUri, intervalMillis: 100 },
          // 파일 입력은 Android 13+에서 기기 내 인식(on-device)으로만 동작한다(라이브러리 안내, AVD에서 audio-capture 오류 확인).
          // 측정용 WAV는 16kHz 16bit 모노다
          ...(options.audioUri
            ? {
                requiresOnDeviceRecognition: true,
                audioSource: { uri: options.audioUri, audioChannels: 1, audioEncoding: AudioEncodingAndroid.ENCODING_PCM_16BIT, sampleRate: 16000 },
              }
            : {}),
        };
        if (__DEV__ && options.audioUri) {
          // 파일 입력은 기기 내 인식이라 한국어 모델이 설치돼 있어야 한다. 없으면 내려받기를 시작한다(측정용)
          const locales = await ExpoSpeechRecognitionModule.getSupportedLocales({}).catch(() => null);
          if (locales && !locales.installedLocales.includes("ko-KR")) {
            const download = await ExpoSpeechRecognitionModule.androidTriggerOfflineModelDownload({ locale: "ko-KR" }).catch(
              (e: Error) => ({ status: "failed", message: e.message })
            );
            console.log(`[voice-timing] ko-KR on-device model download: ${JSON.stringify(download)}`);
          }
        }
        startedAt.current = Date.now();
        setListening(true);
        ExpoSpeechRecognitionModule.start(startOptions);
        return true;
      } catch (error: unknown) {
        finish({ kind: "unavailable", reason: error instanceof Error ? error.message : "start-failed" });
        return false;
      }
    },
    [finish, reset]
  );

  /** 말을 다 했다고 알린다. 마지막 결과가 오면 `end`에서 `outcome`이 채워진다 */
  const stop = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      finish({ kind: "no-speech" });
    }
  }, [finish]);

  /** 결과 없이 끝낸다(화면을 닫을 때) */
  const abort = useCallback(() => {
    settled.current = true;
    try {
      ExpoSpeechRecognitionModule.abort();
    } catch {
      // 이미 끝났으면 할 일이 없다
    }
    setListening(false);
  }, []);

  return { listening, interim, level, outcome, start, stop, abort, reset };
}
