import {
  arrivalDeltaText,
  minutesLabel,
  phaseBannerLabel,
  nextTrainText,
  phaseTitle,
  remainingParts,
  remainingText,
  rideDetail,
  upcomingMessage,
  walkDetail,
} from "./guideText";

describe("upcomingMessage", () => {
  it("바로 다음 역에서 내리면 내릴 준비를 안내한다", () => {
    expect(upcomingMessage({ kind: "ALIGHT", index: 5, stopsAway: 1 }, "신논현")).toBe(
      "다음 역 신논현, 내릴 준비하세요"
    );
  });

  it("멀면 남은 역 수를 알려 준다", () => {
    expect(upcomingMessage({ kind: "ALIGHT", index: 5, stopsAway: 3 }, "신논현")).toBe(
      "신논현에서 내려요 · 3개 역 남음"
    );
    expect(upcomingMessage({ kind: "TRANSFER", index: 2, stopsAway: 2 }, "당산")).toBe(
      "당산에서 갈아타요 · 2개 역 남음"
    );
  });

  it("바로 다음 역에서 갈아타면 갈아타라고 안내한다", () => {
    expect(upcomingMessage({ kind: "TRANSFER", index: 2, stopsAway: 1 }, "당산")).toBe(
      "다음 역 당산에서 갈아타세요"
    );
  });

  it("할 일이 없으면 빈 문구다", () => {
    expect(upcomingMessage(null, "")).toBe("");
  });
});

describe("remainingText", () => {
  it("남은 시간과 한국 시간 도착 시각을 보여 준다", () => {
    // 2026-10-11T05:20:00Z = 한국 시간 14:20
    const now = Date.parse("2026-10-11T05:20:00Z");
    expect(remainingText(31 * 60, now)).toBe("31분 남음 · 오후 2:51 도착");
  });

  it("다 지나면 곧 도착한다고 한다", () => {
    expect(remainingText(0, 0)).toBe("곧 도착해요");
  });
});

describe("remainingParts", () => {
  it("큰 글자와 작은 글자로 나눈다", () => {
    const now = Date.parse("2026-10-11T05:20:00Z");
    expect(remainingParts(31 * 60, now)).toEqual({ amount: "31분", rest: "남음 · 오후 2:51 도착" });
  });

  it("다 지나면 곧 도착해요로 나눈다", () => {
    expect(remainingParts(0, 0)).toEqual({ amount: "곧", rest: "도착해요" });
  });
});

describe("arrivalDeltaText", () => {
  it("일찍과 늦게를 구분한다", () => {
    expect(arrivalDeltaText(-60)).toBe("1분 일찍 도착");
    expect(arrivalDeltaText(300)).toBe("5분 늦게 도착");
  });

  it("30초 안이면 예정대로라고 한다", () => {
    expect(arrivalDeltaText(20)).toBe("예정대로 도착");
    expect(arrivalDeltaText(-29)).toBe("예정대로 도착");
  });

  it("값이 없으면 빈 문구다", () => {
    expect(arrivalDeltaText(undefined)).toBe("");
  });
});

describe("minutesLabel", () => {
  it("분으로 반올림하고 1분 미만도 1분으로 보여 준다", () => {
    expect(minutesLabel(31 * 60)).toBe("31분");
    expect(minutesLabel(20)).toBe("1분");
    expect(minutesLabel(0)).toBe("1분");
  });
});

describe("단계 문구", () => {
  it("배너 라벨은 걷는 중과 기다리는 중에 탈 역을 가리킨다", () => {
    expect(phaseBannerLabel("WALK_TO_STATION")).toBe("걸어갈 역");
    expect(phaseBannerLabel("WAITING")).toBe("탈 역");
    expect(phaseBannerLabel("RIDING")).toBe("다음 역");
  });

  it("제목은 걷는 중과 기다리는 중이 다르다", () => {
    expect(phaseTitle("WALK_TO_STATION", "건대입구")).toBe("건대입구까지 걸어가요");
    expect(phaseTitle("WAITING", "건대입구")).toBe("건대입구 승강장에서 기다려요");
  });

  it("역 이름을 아직 모르면 탑승역이라고 부른다", () => {
    expect(phaseTitle("WAITING", "")).toBe("탑승역 승강장에서 기다려요");
  });

  it("남은 거리는 1km 아래는 m로, 그 위는 km로 보여 준다", () => {
    expect(walkDetail(320)).toBe("약 320m 남았어요");
    expect(walkDetail(1250)).toBe("약 1.3km 남았어요");
  });

  it("거리를 모르면 문구가 없다", () => {
    expect(walkDetail(undefined)).toBe("");
    expect(walkDetail(Number.NaN)).toBe("");
  });

  it("탈 열차 설명은 호선과 내릴 역을 잇는다", () => {
    expect(rideDetail("2호선", "을지로입구")).toBe("2호선 · 을지로입구까지");
    expect(rideDetail("2호선", "")).toBe("2호선");
  });
});

describe("nextTrainText", () => {
  const train = { headsign: "판교", arrivalInSec: 300 };

  it("시각표면 출발, 실시간이면 도착으로 분을 올림해 쓴다", () => {
    expect(nextTrainText(train, "TIMETABLE")).toBe("판교 방면 · 5분 후 출발");
    expect(nextTrainText({ headsign: "판교", arrivalInSec: 301 }, "REALTIME")).toBe("판교 방면 · 6분 후 도착");
  });

  it("1분 미만이면 곧 출발이나 곧 도착이다", () => {
    expect(nextTrainText({ headsign: "판교", arrivalInSec: 45 }, "TIMETABLE")).toBe("판교 방면 · 곧 출발");
    expect(nextTrainText({ headsign: "판교", arrivalInSec: 0 }, "REALTIME")).toBe("판교 방면 · 곧 도착");
  });

  it("응답 뒤로 흐른 시간을 뺀다", () => {
    expect(nextTrainText(train, "TIMETABLE", 120)).toBe("판교 방면 · 3분 후 출발");
    expect(nextTrainText(train, "TIMETABLE", 290)).toBe("판교 방면 · 곧 출발");
    expect(nextTrainText(train, "TIMETABLE", -30)).toBe("판교 방면 · 5분 후 출발");
  });

  it("열차나 남은 시간을 모르면 빈 문자열, 행선지가 없으면 시간만 쓴다", () => {
    expect(nextTrainText(undefined, "TIMETABLE")).toBe("");
    expect(nextTrainText({ headsign: "판교", arrivalInSec: null }, "TIMETABLE")).toBe("");
    expect(nextTrainText({ headsign: "", arrivalInSec: 120 }, "TIMETABLE")).toBe("2분 후 출발");
  });
});
