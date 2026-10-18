export interface Option {
  code: string;
  label: string;
}

/** 코드와 라벨은 sub1s-docs/API_SPEC.md 2.1.2의 표와 같다 */
export const PURPOSES: Option[] = [
  { code: "COMMUTE", label: "출퇴근" },
  { code: "SCHOOL", label: "통학" },
  { code: "MEETING", label: "약속·모임" },
  { code: "TRAVEL", label: "여행" },
  { code: "EXERCISE", label: "운동" },
  { code: "SHOPPING", label: "쇼핑" },
  { code: "HOSPITAL", label: "병원" },
  { code: "DATE", label: "데이트" },
];

export const ROUTE_PREFS: Option[] = [
  { code: "FAST", label: "빠르게" },
  { code: "FEW_TRANSFERS", label: "환승 적게" },
  { code: "WEAK_AC", label: "약냉방칸" },
  { code: "UNCROWDED", label: "덜 붐비게" },
  { code: "LESS_WALK", label: "덜 걷게" },
  { code: "SEAT", label: "앉아서 가기" },
  { code: "ELEVATOR", label: "엘리베이터 있는 역" },
  { code: "LOW_FARE", label: "요금 아끼기" },
  { code: "AVOID_STAIRS", label: "계단 피하기" },
  { code: "EXPRESS", label: "급행 선호" },
  { code: "FAMILIAR_ROUTE", label: "익숙한 경로" },
];

/** 서버가 반영하지 못했다고 알린 선호 코드를 안내 문구로 만든다. 이름을 아는 코드가 없으면 null */
export function unsupportedPreferenceNotice(codes: string[] | undefined): string | null {
  const labels = (codes ?? []).flatMap((code) => ROUTE_PREFS.find((item) => item.code === code)?.label ?? []);
  return labels.length > 0 ? `아직 반영하지 못한 선호: ${labels.join(" · ")}` : null;
}

/** 이미 골랐으면 빼고 아니면 더한다. 고른 순서를 유지한다 */
export function toggleSelection(selected: string[], code: string): string[] {
  return selected.includes(code) ? selected.filter((item) => item !== code) : [...selected, code];
}

export type Step = 1 | 2;

/** 각 단계는 하나 이상 골라야 넘어갈 수 있다 */
export function canProceed(step: Step, purposes: string[], routePrefs: string[]): boolean {
  return (step === 1 ? purposes : routePrefs).length > 0;
}
