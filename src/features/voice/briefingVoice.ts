export interface BriefingSource {
  briefingText: string;
  /** 서버가 주는 음성 경로. 도메인 없는 상대 경로(`/api/v1/voice/tts/stream?text=...`)일 수 있다 */
  audioTtsUrl?: string;
}

/** 어떤 음성으로 읽기 시작했는지. `none`이면 읽을 것이 없다 */
export type BriefingVoiceOutcome = "server" | "device" | "none";

export interface BriefingVoiceDeps {
  /** 서버 음성을 재생한다. 재생이 시작되면 true, 불러오지 못하면 false */
  playServer: (url: string) => Promise<boolean>;
  /** 기기 내장 음성으로 문장을 읽는다 */
  speakDevice: (text: string) => void;
}

/** 서버가 준 상대 경로에 서버 주소를 붙인다. 이미 전체 주소면 그대로 둔다 */
export function resolveTtsUrl(audioTtsUrl: string, baseUrl: string): string {
  if (/^https?:\/\//i.test(audioTtsUrl)) return audioTtsUrl;
  const base = baseUrl.replace(/\/+$/, "");
  const path = audioTtsUrl.startsWith("/") ? audioTtsUrl : `/${audioTtsUrl}`;
  return `${base}${path}`;
}

/** 읽어 줄 수 있는지. 서버 음성이 없어도 기기 음성이 있으므로 문장만 있으면 된다 */
export function canSpeakBriefing(source: BriefingSource): boolean {
  return source.briefingText.trim().length > 0 || Boolean(source.audioTtsUrl);
}

/**
 * 서버 음성을 먼저 시도하고, 안 되면 기기 음성으로 읽는다.
 * `skipServer`는 같은 결과에서 서버가 이미 실패했을 때 다시 기다리지 않으려는 것이다
 */
export async function playBriefing(
  source: BriefingSource,
  deps: BriefingVoiceDeps,
  skipServer: boolean
): Promise<BriefingVoiceOutcome> {
  if (source.audioTtsUrl && !skipServer) {
    let started = false;
    try {
      started = await deps.playServer(source.audioTtsUrl);
    } catch {
      started = false;
    }
    if (started) return "server";
  }

  const text = source.briefingText.trim();
  if (!text) return "none";
  deps.speakDevice(text);
  return "device";
}
