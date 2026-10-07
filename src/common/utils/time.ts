/**
 * 소요 시간(분)을 한국어 시간 문자열로 변환 (예: 75 -> "1시간 15분", 25 -> "25분")
 */
export function formatDurationMinutes(minutes: number): string {
  if (minutes < 0) return "0분";
  const hours = Math.floor(minutes / 60);
  const remainingMins = Math.round(minutes % 60);

  if (hours > 0) {
    return remainingMins > 0 ? `${hours}시간 ${remainingMins}분` : `${hours}시간`;
  }
  return `${remainingMins}분`;
}

/**
 * 남은 시간(초)을 한국어 초/분 문자열로 변환 (예: 150 -> "2분 30초", 40 -> "40초", 0 -> "곧 도착")
 */
export function formatRemainingSec(seconds: number): string {
  if (seconds <= 0) return "곧 도착";
  const mins = Math.floor(seconds / 60);
  const remainingSecs = Math.floor(seconds % 60);

  if (mins > 0) {
    return remainingSecs > 0 ? `${mins}분 ${remainingSecs}초` : `${mins}분`;
  }
  return `${remainingSecs}초`;
}

/**
 * ISO-8601 UTC 타임스탬프를 한국 시간대(KST, UTC+9) 시:분 문자열로 변환 (예: "오후 2:30")
 */
export function formatIsoToKoreanTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return "";
  }
}
