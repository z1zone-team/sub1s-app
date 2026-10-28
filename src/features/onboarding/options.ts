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

/** 1: 용무, 2: 경로 취향, 3: 닉네임(처음 설문에서만) */
export type Step = 1 | 2 | 3;

/** 설문 단계(1, 2)는 하나 이상 골라야 넘어갈 수 있다. 닉네임 단계는 화면에서 따로 검사한다 */
export function canProceed(step: Step, purposes: string[], routePrefs: string[]): boolean {
  if (step === 3) return true;
  return (step === 1 ? purposes : routePrefs).length > 0;
}

/** 전체 단계 수. 설정에서 다시 고칠 때는 닉네임 단계가 없다(닉네임은 프로필 수정에서 바꾼다) */
export function totalSteps(editing: boolean): 2 | 3 {
  return editing ? 2 : 3;
}

/** 다음 단계. 마지막 단계면 null(저장하고 끝낸다) */
export function nextStep(step: Step, editing: boolean): Step | null {
  return step < totalSteps(editing) ? ((step + 1) as Step) : null;
}
