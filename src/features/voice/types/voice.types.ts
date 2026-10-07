export type VoiceIntent = "RECOMMEND_ROUTE" | "CONGESTION_CHECK" | "UNKNOWN";

export interface VoiceRecognizeResultDto {
  transcription: string;
  intent: VoiceIntent;
  isFallback: boolean;
  parsedSlots: {
    origin?: string;
    destination?: string;
    preference?: string;
  };
  briefingText?: string;
  ttsAudioUrl?: string;
}
