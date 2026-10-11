/** 1750 -> "1,750원" */
export function formatFare(won: number): string {
  if (!Number.isFinite(won) || won < 0) return "0원";
  return `${Math.round(won).toLocaleString("en-US")}원`;
}

/** 초를 분으로 올림 없이 반올림하고, 1분 미만이어도 최소 1분으로 보여 준다 (예: 29 -> "1분", 1470 -> "25분") */
export function formatDurationSec(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0분";
  const minutes = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${minutes}분`;
  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
}

/** 0.8 -> "800m", 12.34 -> "12.3km" */
export function formatDistanceKm(km: number): string {
  if (!Number.isFinite(km) || km <= 0) return "0m";
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${(Math.round(km * 10) / 10).toFixed(1)}km`;
}
