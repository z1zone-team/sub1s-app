import type { PathSegmentDto } from "@/apis/queries/routing/searchRoutes";
import { guideNotice, rideLabel, walkMinutes } from "./guideNotice";

const segment = (lineId: string, direction: PathSegmentDto["direction"]): PathSegmentDto =>
  ({ lineId, direction }) as PathSegmentDto;

describe("walkMinutes", () => {
  it("거리를 걷는 속도로 나눠 분으로 반올림하고 1분 미만이어도 1분이다", () => {
    expect(walkMinutes(720)).toBe(10);
    expect(walkMinutes(430)).toBe(6);
    expect(walkMinutes(20)).toBe(1);
    expect(walkMinutes(0)).toBe(1);
  });
});

describe("rideLabel", () => {
  it("호선 이름에 방향을 붙이고, 방향을 모르면 호선만 쓴다", () => {
    expect(rideLabel(segment("02", "INNER"))).toBe("2호선 내선");
    expect(rideLabel(segment("03", "UP"))).toBe("3호선 상행");
    expect(rideLabel(segment("02", "NONE"))).toBe("2호선");
  });
});

describe("guideNotice", () => {
  const boarding = { stationName: "강남", segment: segment("02", "INNER") };

  it("걷는 중에는 첫 탑승역까지 걸어가라고 걸리는 시간과 함께 알린다", () => {
    expect(guideNotice({ phase: "WALK_TO_STATION", boardedRides: 0, boarding, distanceToStationM: 720 })).toEqual({
      id: "walk:0",
      title: "강남역까지 걸어가세요",
      body: "약 10분 · 2호선 내선을 타요",
    });
  });

  it("거리를 모르면 걸리는 시간 없이 알린다", () => {
    expect(guideNotice({ phase: "WALK_TO_STATION", boardedRides: 0, boarding })?.body).toBe("2호선 내선을 타요");
  });

  it("승강장에서 기다리는 중에는 어느 열차를 타라고 알린다", () => {
    expect(guideNotice({ phase: "WAITING", boardedRides: 1, boarding })).toEqual({
      id: "board:1",
      title: "강남역에 도착했어요",
      body: "2호선 내선 열차를 타세요",
    });
  });

  it("몇 번째 탑승인지가 id에 들어가 환승 뒤의 알림은 따로 한 번 더 나온다", () => {
    const first = guideNotice({ phase: "WAITING", boardedRides: 0, boarding });
    const second = guideNotice({ phase: "WAITING", boardedRides: 1, boarding });

    expect(first?.id).not.toBe(second?.id);
  });

  it("열차를 타고 가는 중이거나 더 탈 열차가 없으면 알림이 없다", () => {
    expect(guideNotice({ phase: "RIDING", boardedRides: 1, boarding })).toBeNull();
    expect(guideNotice({ phase: "WAITING", boardedRides: 2 })).toBeNull();
  });
});
