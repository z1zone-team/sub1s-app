const DEFAULT_MAX = 6;

/**
 * 진행 막대에 보일 역의 순번 (보이는 역 목록 안에서의 순번). 처음, 지금, 다음, 마지막 역은 반드시 넣고,
 * 남는 자리는 나머지 역에서 일정 간격으로 고른다. 역이 max개 이하면 전부 보여 준다
 */
export function pickTrackStops(count: number, currentIndex: number, max: number = DEFAULT_MAX): number[] {
  if (count <= 0) return [];
  if (count <= max) return Array.from({ length: count }, (_, index) => index);

  const must = new Set<number>([0, count - 1]);
  const current = Math.min(Math.max(currentIndex, 0), count - 1);
  must.add(current);
  if (current + 1 < count) must.add(current + 1);

  const chosen = new Set(must);
  const rest = Array.from({ length: count }, (_, index) => index).filter((index) => !chosen.has(index));
  const room = max - chosen.size;
  if (room > 0 && rest.length > 0) {
    const step = rest.length / (room + 1);
    for (let slot = 1; slot <= room; slot += 1) chosen.add(rest[Math.min(rest.length - 1, Math.round(step * slot) - 1)]);
  }
  return [...chosen].sort((a, b) => a - b).slice(0, max);
}

/**
 * 진행 막대가 채워진 비율(0~1). 보이는 역의 점은 같은 간격이므로 지금 위치가 두 점 사이에 있으면
 * 그 사이를 실제 순번 차이만큼 나눠 채운다
 */
export function trackFill(picked: number[], currentIndex: number): number {
  if (picked.length < 2) return 0;
  if (currentIndex <= picked[0]) return 0;
  if (currentIndex >= picked[picked.length - 1]) return 1;

  for (let i = 0; i < picked.length - 1; i += 1) {
    if (currentIndex >= picked[i] && currentIndex <= picked[i + 1]) {
      const span = picked[i + 1] - picked[i];
      return (i + (currentIndex - picked[i]) / span) / (picked.length - 1);
    }
  }
  return 0;
}
