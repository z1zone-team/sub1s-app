import { formatClock24Kst } from "@/common/utils/format";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 고를 수 있는 날짜 수(오늘 포함) */
export const DEPARTURE_DAY_COUNT = 7;
/** 분은 이 간격으로 고른다 */
export const DEPARTURE_MINUTE_STEP = 5;

/** 한국 시간 기준 그날 0시의 시각(ms) */
export function kstDayStart(ms: number): number {
  return Math.floor((ms + KST_OFFSET_MS) / DAY_MS) * DAY_MS - KST_OFFSET_MS;
}

export interface DepartureDay {
  /** 그날 0시(한국 시간)의 시각(ms) */
  startMs: number;
  /** "오늘", "내일", "10/21(수)" */
  label: string;
}

/** 오늘부터 며칠 동안의 날짜 후보 */
export function departureDays(nowMs: number, count: number = DEPARTURE_DAY_COUNT): DepartureDay[] {
  const today = kstDayStart(nowMs);
  return Array.from({ length: count }, (_, index) => {
    const startMs = today + index * DAY_MS;
    if (index === 0) return { startMs, label: "오늘" };
    if (index === 1) return { startMs, label: "내일" };
    const kst = new Date(startMs + KST_OFFSET_MS);
    return { startMs, label: `${kst.getUTCMonth() + 1}/${kst.getUTCDate()}(${WEEKDAYS[kst.getUTCDay()]})` };
  });
}

/** 날짜(그날 0시)와 시, 분으로 출발 시각(ms)을 만든다 */
export function composeDeparture(dayStartMs: number, hour: number, minute: number): number {
  return dayStartMs + hour * 60 * MINUTE_MS + minute * MINUTE_MS;
}

/** 지금 이후 가장 가까운 선택 가능한 시각(분 간격으로 올림). 이보다 이른 시각은 고를 수 없다 */
export function earliestDeparture(nowMs: number, step: number = DEPARTURE_MINUTE_STEP): number {
  const unit = step * MINUTE_MS;
  return Math.ceil(nowMs / unit) * unit;
}

/** 고른 시각이 지금이 속한 분 간격(예: 14:17이면 14:15)보다 이르면 false. 이미 지난 시각은 고를 수 없다 */
export function isSelectableDeparture(departureMs: number, nowMs: number, step: number = DEPARTURE_MINUTE_STEP): boolean {
  const unit = step * MINUTE_MS;
  return departureMs >= Math.floor(nowMs / unit) * unit;
}

/** 고른 시각을 날짜와 시, 분으로 나눈다(한국 시간). 날짜는 후보 안의 순번이고 없으면 -1이다 */
export function splitDeparture(
  departureMs: number,
  days: DepartureDay[]
): { dayIndex: number; hour: number; minute: number } {
  const dayStart = kstDayStart(departureMs);
  const dayIndex = days.findIndex((day) => day.startMs === dayStart);
  const into = departureMs - dayStart;
  return { dayIndex, hour: Math.floor(into / (60 * MINUTE_MS)), minute: Math.floor((into % (60 * MINUTE_MS)) / MINUTE_MS) };
}

/**
 * 출발 줄의 문구. 고르지 않았으면 열어 본 시각 기준 "오늘 14:17 출발", 골랐으면 날짜가 오늘이면 "오늘 21:30 출발",
 * 내일이면 "내일 08:30 출발", 그보다 뒤면 "10월 22일 08:30 출발"이다
 */
export function departureText(departureMs: number, nowMs: number): string {
  const dayDiff = Math.round((kstDayStart(departureMs) - kstDayStart(nowMs)) / DAY_MS);
  const clock = formatClock24Kst(departureMs);
  if (dayDiff === 0) return `오늘 ${clock} 출발`;
  if (dayDiff === 1) return `내일 ${clock} 출발`;
  const kst = new Date(departureMs + KST_OFFSET_MS);
  return `${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일 ${clock} 출발`;
}
