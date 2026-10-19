import {
  createSilenceStop,
  INITIAL_WAIT_MS,
  MIN_SPEECH_RUN_MS,
  SILENCE_STOP_MS,
  SPEECH_LEVEL,
} from "./silenceStop";

const STEP = 100;
const LOUD = SPEECH_LEVEL + 0.2;

/** 시작 시각부터 durationMs 동안 level을 샘플 간격마다 넣고, 처음 true가 나온 시각(없으면 null)을 돌려준다 */
function run(
  stop: ReturnType<typeof createSilenceStop>,
  segments: Array<[level: number, durationMs: number]>
): number | null {
  let t = 0;
  for (const [level, durationMs] of segments) {
    const end = t + durationMs;
    while (t < end) {
      t += STEP;
      if (stop.push(level, t)) return t;
    }
  }
  return null;
}

describe("createSilenceStop", () => {
  it("말이 없으면 INITIAL_WAIT_MS가 지나서야 끝낸다", () => {
    const stop = createSilenceStop();

    expect(run(stop, [[0, INITIAL_WAIT_MS - STEP]])).toBeNull();
    expect(stop.push(0, INITIAL_WAIT_MS)).toBe(true);
    expect(stop.heardSpeech()).toBe(false);
  });

  it("말이 끝나고 SILENCE_STOP_MS만큼 조용하면 끝낸다", () => {
    const stop = createSilenceStop();

    const stoppedAt = run(stop, [
      [0, 1000],
      [LOUD, 1500],
      [0, 3000],
    ]);

    expect(stoppedAt).toBe(1000 + 1500 + SILENCE_STOP_MS);
    expect(stop.heardSpeech()).toBe(true);
  });

  it("말이 시작된 뒤에는 처음 기다림이 지나도 말을 하고 있으면 끝내지 않는다", () => {
    const stop = createSilenceStop();

    expect(run(stop, [[LOUD, INITIAL_WAIT_MS + 3000]])).toBeNull();
  });

  it("말 사이의 짧은 쉼에서는 끝내지 않는다", () => {
    const stop = createSilenceStop();

    expect(
      run(stop, [
        [LOUD, 800],
        [0, SILENCE_STOP_MS - STEP * 2],
        [LOUD, 800],
        [0, SILENCE_STOP_MS - STEP * 2],
        [LOUD, 500],
      ])
    ).toBeNull();
  });

  it("MIN_SPEECH_RUN_MS보다 짧은 순간 소리는 말로 보지 않는다", () => {
    const stop = createSilenceStop();

    // 버튼을 누를 때 나는 소리 같은 짧은 소리가 있어도 말이 시작된 것이 아니라 처음 기다림이 지나야 끝난다
    expect(
      run(stop, [
        [LOUD, MIN_SPEECH_RUN_MS - STEP],
        [0, 2000],
      ])
    ).toBeNull();
    expect(stop.heardSpeech()).toBe(false);
    expect(stop.push(0, INITIAL_WAIT_MS)).toBe(true);
  });

  it("끊어진 소리가 여러 번 있어도 이어지지 않으면 말로 보지 않는다", () => {
    const stop = createSilenceStop();

    for (let i = 0; i < 10; i += 1) {
      stop.push(LOUD, i * 400);
      stop.push(0, i * 400 + 200);
    }

    expect(stop.heardSpeech()).toBe(false);
  });

  it("값을 바꿔 쓸 수 있다", () => {
    const stop = createSilenceStop({ initialWaitMs: 2000, silenceMs: 500, minSpeechRunMs: 100, speechLevel: 0.5 });

    expect(run(stop, [[0.4, 1900]])).toBeNull();
    expect(stop.heardSpeech()).toBe(false);
    expect(stop.push(0.4, 2000)).toBe(true);

    stop.reset();
    expect(run(stop, [[0.8, 500], [0, 2000]])).toBe(500 + 500);
  });

  it("숫자가 아닌 입력은 조용한 것으로 본다", () => {
    const stop = createSilenceStop();

    expect(stop.push(Number.NaN, 100)).toBe(false);
    expect(stop.heardSpeech()).toBe(false);
  });

  it("reset하면 처음으로 돌아간다", () => {
    const stop = createSilenceStop();
    run(stop, [[LOUD, 1000]]);
    expect(stop.heardSpeech()).toBe(true);

    stop.reset();

    expect(stop.heardSpeech()).toBe(false);
    expect(stop.push(0, 100)).toBe(false);
  });
});
