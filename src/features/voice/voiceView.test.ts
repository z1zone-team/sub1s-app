import { ApiError } from "@/apis/client";
import type { SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import type { VoiceDestinationCandidateDto } from "@/apis/mutations/voice/voiceRouteTypes";
import {
  candidateAddress,
  candidateNearestText,
  candidateToEndpoint,
  confirmStepOf,
  confirmTitle,
  destinationLineId,
  endpointsOfOption,
  failureOf,
  FAILURE_TEXT,
  modeLabel,
  modeReasonText,
  originToEndpoint,
  pickCandidate,
  WAVE_HEIGHTS,
  waveDelayMs,
} from "./voiceView";
import { VoiceJobFailedError } from "./voiceJob";

const segment = (lineId: string, from: string, to: string) =>
  ({ lineId, fromStationId: from, fromStationName: from + "역", toStationId: to, toStationName: to + "역" }) as never;

describe("failureOf", () => {
  it("상태 코드로 실패 종류를 가른다", () => {
    expect(failureOf(new ApiError("UNAUTHORIZED", "x", 401))).toBe("LOGIN");
    expect(failureOf(new ApiError("TOO_MANY_REQUESTS", "x", 429))).toBe("BUSY");
    expect(failureOf(new ApiError("NOT_FOUND", "x", 404))).toBe("NOT_FOUND");
    expect(failureOf(new ApiError("INTERNAL", "x", 500))).toBe("GENERIC");
  });

  it("말소리가 없었다는 오류는 코드로 알아보고 같은 422인 출발지 없음과 구분한다", () => {
    expect(failureOf(new ApiError("VOICE_NO_SPEECH", "x", 422))).toBe("NO_SPEECH");
    expect(failureOf(new VoiceJobFailedError({ code: "VOICE_NO_SPEECH", message: "x", status: 422 }))).toBe("NO_SPEECH");
    expect(failureOf(new ApiError("VOICE_ORIGIN_REQUIRED", "x", 422))).toBe("ORIGIN_REQUIRED");
  });

  it("집이나 학교를 저장하지 않았다는 오류는 저장 안내로 보여 주고 같은 422인 출발지 없음과 구분한다", () => {
    expect(failureOf(new ApiError("VOICE_PLACE_NOT_SAVED", "x", 422))).toBe("PLACE_NOT_SAVED");
    expect(failureOf(new VoiceJobFailedError({ code: "VOICE_PLACE_NOT_SAVED", message: "x", status: 422 }))).toBe("PLACE_NOT_SAVED");
    expect(failureOf(new ApiError("VOICE_ORIGIN_REQUIRED", "x", 422))).toBe("ORIGIN_REQUIRED");
  });

  it("어디로 갈지 알아듣지 못한 오류는 출발역 안내가 아니라 역을 못 찾았다는 안내다", () => {
    expect(failureOf(new ApiError("VOICE_INTENT_NOT_UNDERSTOOD", "x", 422))).toBe("NOT_FOUND");
    expect(failureOf(new VoiceJobFailedError({ code: "VOICE_INTENT_NOT_UNDERSTOOD", message: "x", status: 422 }))).toBe("NOT_FOUND");
  });

  it("출발지 없음, 너무 긴 녹음, 서버가 쓸 수 없음도 따로 안내한다", () => {
    expect(failureOf(new ApiError("VOICE_ORIGIN_REQUIRED", "x", 422))).toBe("ORIGIN_REQUIRED");
    expect(failureOf(new ApiError("VOICE_AUDIO_TOO_LARGE", "x", 413))).toBe("TOO_LONG");
    expect(failureOf(new ApiError("VOICE_QUEUE_FULL", "x", 503))).toBe("UNAVAILABLE");
    expect(failureOf(new ApiError("VOICE_QUEUE_UNAVAILABLE", "x", 503))).toBe("UNAVAILABLE");
  });

  it("작업이 실패했다는 알림(VoiceJobFailedError)도 같은 상태로 가른다", () => {
    const failed = (status: number) => new VoiceJobFailedError({ code: "X", message: "m", status });

    expect(failureOf(failed(404))).toBe("NOT_FOUND");
    expect(failureOf(failed(422))).toBe("ORIGIN_REQUIRED");
    expect(failureOf(failed(503))).toBe("UNAVAILABLE");
    expect(failureOf(failed(429))).toBe("BUSY");
    expect(failureOf(failed(504))).toBe("GENERIC");
    expect(failureOf(failed(500))).toBe("GENERIC");
  });

  it("알 수 없는 오류는 일반 실패다", () => {
    expect(failureOf(new Error("boom"))).toBe("GENERIC");
    expect(failureOf(undefined)).toBe("GENERIC");
  });

  it("모든 실패 종류에 안내 문구가 있다", () => {
    for (const kind of ["NO_SPEECH", "NOT_FOUND", "ORIGIN_REQUIRED", "PLACE_NOT_SAVED", "TOO_LONG", "UNAVAILABLE", "BUSY", "LOGIN", "GENERIC"] as const) {
      expect(FAILURE_TEXT[kind].title).not.toBe("");
      expect(FAILURE_TEXT[kind].body).not.toBe("");
    }
  });
});

describe("modeReasonText", () => {
  it("모드마다 문구가 다르다", () => {
    expect(modeReasonText("PERSONAL")).toBe("취향에 맞춘 경로로 찾았어요");
    expect(modeReasonText("OPTIMAL")).toBe("종합 최적 경로로 찾았어요");
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

describe("음성 도착지 후보", () => {
  const place: VoiceDestinationCandidateDto = {
    type: "PLACE",
    name: "명지대학교/인문캠퍼스",
    address: "서울 서대문구 거북골로 34",
    lat: 37.58,
    lng: 126.92,
    nearestStation: { stationId: "GJ_K315", name: "가좌", walkDistanceM: 900, walkDurationSec: 1440 },
  };
  const station: VoiceDestinationCandidateDto = {
    type: "STATION",
    name: "서울숲",
    lat: 37.54,
    lng: 127.04,
    stationId: "BD_K211",
  };

  it("역 후보는 역 ID로, 장소 후보는 좌표와 이름으로 경로를 찾는다", () => {
    expect(candidateToEndpoint(station)).toEqual({ name: "서울숲", stationId: "BD_K211" });
    expect(candidateToEndpoint(place)).toEqual({ name: "명지대학교/인문캠퍼스", lat: 37.58, lng: 126.92 });
  });

  it("역 후보인데 역 ID가 없으면 좌표로 찾는다", () => {
    expect(candidateToEndpoint({ ...station, stationId: undefined })).toEqual({ name: "서울숲", lat: 37.54, lng: 127.04 });
  });

  it("후보 아래 줄: 장소는 주소, 역은 지하철역", () => {
    expect(candidateAddress(place)).toBe("서울 서대문구 거북골로 34");
    expect(candidateAddress(station)).toBe("지하철역");
    expect(candidateAddress({ ...place, address: undefined })).toBe("");
  });

  it("가장 가까운 역까지 걸어서 몇 분인지 말해 준다(최소 1분)", () => {
    expect(candidateNearestText(place)).toBe("가좌역에서 걸어서 24분");
    expect(candidateNearestText({ ...place, nearestStation: { ...place.nearestStation!, walkDurationSec: 20 } })).toBe(
      "가좌역에서 걸어서 1분"
    );
  });

  it("역 후보와 가까운 역 정보가 없는 후보는 걸음 문구가 없다", () => {
    expect(candidateNearestText(station)).toBeNull();
    expect(candidateNearestText({ ...place, nearestStation: undefined })).toBeNull();
  });

  it("출발지는 역이면 역 ID, 현재 위치나 장소이면 좌표로 바꾸고 둘 다 없으면 null이다", () => {
    expect(originToEndpoint({ name: "강남", stationId: "02_222" })).toEqual({ name: "강남", stationId: "02_222" });
    expect(originToEndpoint({ name: "현재 위치", lat: 37.2, lng: 127.1 })).toEqual({
      name: "현재 위치",
      lat: 37.2,
      lng: 127.1,
    });
    expect(originToEndpoint({ name: "어딘가" })).toBeNull();
  });
});

describe("후보 확인 단계", () => {
  const intent = { originStationName: "x", destStationName: "y", preferredMode: "OPTIMAL", reason: "" } as never;
  const cand = (name: string): VoiceDestinationCandidateDto => ({ type: "PLACE", name, lat: 37.5, lng: 127.0 });
  const gangnam = { name: "강남", stationId: "02_222" };

  it("도착 확인 결과는 정해진 출발지로 도착을 묻는 단계가 된다", () => {
    const step = confirmStepOf({
      kind: "CONFIRM_DESTINATION",
      transcript: "t",
      interpretedIntent: intent,
      origin: gangnam,
      candidates: [cand("가"), cand("나")],
    });

    expect(step).toMatchObject({ question: "DESTINATION", origin: { name: "강남", stationId: "02_222" }, destination: null });
    expect(step?.candidates).toHaveLength(2);
  });

  it("출발지가 경로 검색에 쓸 수 없으면 단계를 만들지 않는다", () => {
    expect(
      confirmStepOf({
        kind: "CONFIRM_DESTINATION",
        transcript: "t",
        interpretedIntent: intent,
        origin: { name: "어딘가" },
        candidates: [cand("가")],
      })
    ).toBeNull();
  });

  it("출발 확인 결과는 도착이 정해졌으면 출발을 묻는 단계, 고르면 바로 경로다", () => {
    const step = confirmStepOf({
      kind: "CONFIRM_ORIGIN",
      transcript: "t",
      interpretedIntent: intent,
      originCandidates: [cand("가"), cand("나")],
      destination: gangnam,
    })!;

    expect(step.question).toBe("ORIGIN");
    expect(pickCandidate(step, cand("나"))).toEqual({
      kind: "route",
      origin: { name: "나", lat: 37.5, lng: 127.0 },
      destination: { name: "강남", stationId: "02_222" },
    });
  });

  it("출발과 도착이 모두 모호하면 출발을 고른 뒤 도착을 묻고, 도착을 고르면 경로다", () => {
    const first = confirmStepOf({
      kind: "CONFIRM_ORIGIN",
      transcript: "t",
      interpretedIntent: intent,
      originCandidates: [cand("출발1"), cand("출발2")],
      destinationCandidates: [cand("도착1"), cand("도착2")],
    })!;

    const next = pickCandidate(first, cand("출발2"));
    expect(next).toMatchObject({ kind: "next", step: { question: "DESTINATION", origin: { name: "출발2" } } });
    if (next?.kind !== "next") return;
    expect(next.step.candidates.map((c) => c.name)).toEqual(["도착1", "도착2"]);
    expect(pickCandidate(next.step, cand("도착1"))).toEqual({
      kind: "route",
      origin: { name: "출발2", lat: 37.5, lng: 127.0 },
      destination: { name: "도착1", lat: 37.5, lng: 127.0 },
    });
  });

  it("도착 정보가 하나도 없는 출발 확인은 단계를 만들지 않는다", () => {
    expect(
      confirmStepOf({ kind: "CONFIRM_ORIGIN", transcript: "t", interpretedIntent: intent, originCandidates: [cand("가")] })
    ).toBeNull();
  });

  it("질문 문구: 출발은 출발지가 맞나요, 도착은 이 곳이 맞나요", () => {
    expect(confirmTitle("ORIGIN")).toBe("출발지가 맞나요?");
    expect(confirmTitle("DESTINATION")).toBe("이 곳이 맞나요?");
  });
});
