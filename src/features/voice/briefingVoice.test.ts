import { canSpeakBriefing, playBriefing, resolveTtsUrl, type BriefingVoiceDeps } from "./briefingVoice";

describe("resolveTtsUrl", () => {
  it("상대 경로에 서버 주소를 붙인다", () => {
    expect(resolveTtsUrl("/api/v1/voice/tts/stream?text=%EC%95%88%EB%82%B4", "http://10.0.2.2:3000")).toBe(
      "http://10.0.2.2:3000/api/v1/voice/tts/stream?text=%EC%95%88%EB%82%B4"
    );
  });

  it("서버 주소 끝의 슬래시는 한 번만 남긴다", () => {
    expect(resolveTtsUrl("/api/v1/voice/tts/stream?text=a", "https://sub1s.devnoco.com/")).toBe(
      "https://sub1s.devnoco.com/api/v1/voice/tts/stream?text=a"
    );
  });

  it("앞의 슬래시가 없는 경로도 이어 붙인다", () => {
    expect(resolveTtsUrl("api/v1/voice/tts/stream?text=a", "http://host")).toBe("http://host/api/v1/voice/tts/stream?text=a");
  });

  it("이미 전체 주소면 그대로 둔다", () => {
    expect(resolveTtsUrl("https://cdn.example.com/a.mp3", "http://host")).toBe("https://cdn.example.com/a.mp3");
  });
});

describe("canSpeakBriefing", () => {
  it("문장이 있으면 서버 음성이 없어도 읽을 수 있다", () => {
    expect(canSpeakBriefing({ briefingText: "안내합니다" })).toBe(true);
  });

  it("문장이 비어 있어도 서버 음성이 있으면 읽을 수 있다", () => {
    expect(canSpeakBriefing({ briefingText: "  ", audioTtsUrl: "/api/v1/voice/tts/stream?text=a" })).toBe(true);
  });

  it("둘 다 없으면 읽을 수 없다", () => {
    expect(canSpeakBriefing({ briefingText: "  " })).toBe(false);
  });
});

describe("playBriefing", () => {
  const source = { briefingText: " 강남역에서 안내합니다 ", audioTtsUrl: "/api/v1/voice/tts/stream?text=a" };
  const makeDeps = (serverResult: boolean | Error): jest.Mocked<BriefingVoiceDeps> => ({
    playServer: jest.fn((_url: string) => (serverResult instanceof Error ? Promise.reject(serverResult) : Promise.resolve(serverResult))),
    speakDevice: jest.fn(),
  });

  it("서버 음성이 시작되면 기기 음성은 쓰지 않는다", async () => {
    const deps = makeDeps(true);

    await expect(playBriefing(source, deps, false)).resolves.toBe("server");

    expect(deps.playServer).toHaveBeenCalledWith("/api/v1/voice/tts/stream?text=a");
    expect(deps.speakDevice).not.toHaveBeenCalled();
  });

  it("서버 음성이 시작되지 않으면 기기 음성으로 문장을 읽는다", async () => {
    const deps = makeDeps(false);

    await expect(playBriefing(source, deps, false)).resolves.toBe("device");

    expect(deps.speakDevice).toHaveBeenCalledWith("강남역에서 안내합니다");
  });

  it("서버 음성이 예외를 던져도 기기 음성으로 읽는다", async () => {
    const deps = makeDeps(new Error("network"));

    await expect(playBriefing(source, deps, false)).resolves.toBe("device");
    expect(deps.speakDevice).toHaveBeenCalledTimes(1);
  });

  it("서버가 이미 실패한 결과면 서버를 다시 부르지 않고 바로 기기 음성으로 읽는다", async () => {
    const deps = makeDeps(true);

    await expect(playBriefing(source, deps, true)).resolves.toBe("device");

    expect(deps.playServer).not.toHaveBeenCalled();
  });

  it("서버 음성 경로가 없으면 기기 음성으로 읽는다", async () => {
    const deps = makeDeps(true);

    await expect(playBriefing({ briefingText: "안내합니다" }, deps, false)).resolves.toBe("device");

    expect(deps.playServer).not.toHaveBeenCalled();
  });

  it("읽을 문장이 없고 서버 음성도 안 되면 아무것도 읽지 않는다", async () => {
    const deps = makeDeps(false);

    await expect(playBriefing({ briefingText: "  ", audioTtsUrl: "/x" }, deps, false)).resolves.toBe("none");

    expect(deps.speakDevice).not.toHaveBeenCalled();
  });
});
