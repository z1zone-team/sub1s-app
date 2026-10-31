export interface BriefingSource {
  briefingText: string;
}

/** 읽어 줄 수 있는지. 문장이 있어야 기기 내장 음성으로 읽는다 */
export function canSpeakBriefing(source: BriefingSource): boolean {
  return source.briefingText.trim().length > 0;
}
