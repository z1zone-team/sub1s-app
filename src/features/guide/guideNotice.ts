import type { PathSegmentDto } from "@/apis/queries/routing/searchRoutes";
import { getLineInfo } from "@/theme";
import type { GuidePhase } from "./guidePhase";

/** 걷는 속도(m/s). 서버가 환승 걷기 시간을 환산하는 값과 같다 */
const WALK_SPEED_M_PER_S = 1.2;

const DIRECTION_LABEL: Record<PathSegmentDto["direction"], string> = {
  INNER: "내선",
  OUTER: "외선",
  UP: "상행",
  DOWN: "하행",
  NONE: "",
};

/** 안내 중 백그라운드에서 띄우는 알림. id가 같으면 한 번만 보낸다 */
export interface GuideNotice {
  id: string;
  title: string;
  body: string;
}

export interface GuideNoticeInput {
  phase: GuidePhase;
  /** 지금까지 탄 열차 수. 같은 단계라도 몇 번째 탑승인지에 따라 알림이 다르다 */
  boardedRides: number;
  /** 다음에 타는 역 이름과 그 구간. 모두 탔으면 없다 */
  boarding?: { stationName: string; segment: PathSegmentDto };
  /** 지금 위치에서 그 역까지의 거리(m). 위치를 모르면 없다 */
  distanceToStationM?: number;
}

/** 걷는 시간(분). 1분 미만이어도 1분으로 센다 */
export function walkMinutes(distanceM: number): number {
  return Math.max(1, Math.round(distanceM / WALK_SPEED_M_PER_S / 60));
}

/** "2호선 내선", 방향을 모르면 "2호선" */
export function rideLabel(segment: PathSegmentDto): string {
  const line = getLineInfo(segment.lineId).name;
  const direction = DIRECTION_LABEL[segment.direction];
  return direction ? `${line} ${direction}` : line;
}

/**
 * 지금 단계에서 띄울 알림. 걷는 중이면 첫 탑승역까지 걸어가라고, 승강장에서 기다리는 중이면 어느 열차를 타라고 알린다.
 * 열차를 타고 가는 동안의 환승과 하차는 서버 알림이 맡으므로 여기서는 없다
 */
export function guideNotice(input: GuideNoticeInput): GuideNotice | null {
  const { boarding } = input;
  if (!boarding) return null;
  const station = `${boarding.stationName}역`;

  if (input.phase === "WALK_TO_STATION") {
    const body =
      input.distanceToStationM === undefined
        ? `${rideLabel(boarding.segment)}을 타요`
        : `약 ${walkMinutes(input.distanceToStationM)}분 · ${rideLabel(boarding.segment)}을 타요`;
    return { id: `walk:${input.boardedRides}`, title: `${station}까지 걸어가세요`, body };
  }

  if (input.phase === "WAITING") {
    return {
      id: `board:${input.boardedRides}`,
      title: `${station}에 도착했어요`,
      body: `${rideLabel(boarding.segment)} 열차를 타세요`,
    };
  }

  return null;
}
