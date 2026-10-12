export interface ValuePart {
  number: string;
  unit: string;
}

/**
 * 도착 화면 통계 칸에서 값을 큰 숫자와 작은 단위로 나눠 그리기 위한 분해.
 * "14.6km"는 [14.6, km], "1시간 5분"은 [1, 시간]과 [5, 분], "0회"는 [0, 회]다.
 * 숫자와 단위로 나눌 수 없으면 값 전체를 숫자 자리에 둔다
 */
export function valueParts(text: string): ValuePart[] {
  const parts: ValuePart[] = [];
  for (const match of text.matchAll(/(\d[\d,.]*)\s*([^\d\s]+)/g)) {
    parts.push({ number: match[1], unit: match[2] });
  }
  return parts.length > 0 ? parts : [{ number: text, unit: "" }];
}
