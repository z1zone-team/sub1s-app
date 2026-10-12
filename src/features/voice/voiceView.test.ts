import { ApiError } from "@/apis/client";
import type { SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import {
  destinationLineId,
  endpointsOfOption,
  failureOf,
  FAILURE_TEXT,
  modeLabel,
  modeReasonText,
  WAVE_HEIGHTS,
  waveDelayMs,
} from "./voiceView";

const segment = (lineId: string, from: string, to: string) =>
  ({ lineId, fromStationId: from, fromStationName: from + "역", toStationId: to, toStationName: to + "역" }) as never;

describe("failureOf", () => {
  it("상태 코드로 실패 종류를 가른다", () => {
    expect(failureOf(new ApiError("UNAUTHORIZED", "x", 401))).toBe("LOGIN");
    expect(failureOf(new ApiError("TOO_MANY_REQUESTS", "x", 429))).toBe("BUSY");
    expect(failureOf(new ApiError("NOT_FOUND", "x", 404))).toBe("NOT_FOUND");
    expect(failureOf(new ApiError("INTERNAL", "x", 500))).toBe("GENERIC");
  });

  it("알 수 없는 오류는 일반 실패다", () => {
    expect(failureOf(new Error("boom"))).toBe("GENERIC");
    expect(failureOf(undefined)).toBe("GENERIC");
  });

  it("모든 실패 종류에 안내 문구가 있다", () => {
    for (const kind of ["NO_SPEECH", "NOT_FOUND", "BUSY", "LOGIN", "GENERIC"] as const) {
      expect(FAILURE_TEXT[kind].title).not.toBe("");
      expect(FAILURE_TEXT[kind].body).not.toBe("");
    }
  });
});

describe("modeReasonText", () => {
  it("모드마다 문구가 다르다", () => {
    expect(modeReasonText("PERSONAL")).toBe("취향에 맞춘 경로로 찾았어요");
    expect(modeReasonText("OPTIMAL")).toBe("가장 빠른 경로로 찾았어요");
  });
});

describe("modeLabel", () => {
  it("굵게 보일 경로 종류만 돌려준다", () => {
    expect(modeLabel("PERSONAL")).toBe("취향에 맞춘 경로");
    expect(modeReasonText("PERSONAL")).toBe(`${modeLabel("PERSONAL")}로 찾았어요`);
  });
});

describe("destinationLineId", () => {
  it("마지막 탑승 구간의 호선을 돌려준다 (도보는 뺀다)", () => {
    const option = {
      segments: [segment("09", "가양", "고속터미널"), segment("03", "고속터미널", "충무로"), segment("WALK", "충무로", "목적지")],
    } as unknown as SubwayRouteOptionDto;
    expect(destinationLineId(option)).toBe("03");
  });

  it("탑승 구간이 없으면 없다", () => {
    const option = { segments: [segment("WALK", "집", "목적지")] } as unknown as SubwayRouteOptionDto;
    expect(destinationLineId(option)).toBeUndefined();
  });
});

describe("파형", () => {
  it("막대는 24개다", () => {
    expect(WAVE_HEIGHTS).toHaveLength(24);
  });

  it("막대마다 시작이 0.07초씩 어긋나고 0.9초를 넘으면 처음으로 돈다", () => {
    expect(waveDelayMs(0)).toBe(0);
    expect(waveDelayMs(1)).toBe(70);
    expect(waveDelayMs(12)).toBe(840);
    expect(waveDelayMs(13)).toBe(10);
  });
});

describe("endpointsOfOption", () => {
  it("도보를 빼고 첫 탑승역과 마지막 도착역을 돌려준다", () => {
    const option = {
      segments: [segment("WALK", "집", "가양"), segment("09", "가양", "고속터미널"), segment("03", "고속터미널", "충무로"), segment("WALK", "충무로", "목적지")],
    } as unknown as SubwayRouteOptionDto;
    expect(endpointsOfOption(option)).toEqual({
      origin: { name: "가양역", stationId: "가양" },
      destination: { name: "충무로역", stationId: "충무로" },
    });
  });

  it("탑승 구간이 없으면 null이다", () => {
    expect(endpointsOfOption({ segments: [segment("WALK", "a", "b")] } as unknown as SubwayRouteOptionDto)).toBeNull();
  });
});
