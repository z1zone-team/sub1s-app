import { needsOnboarding } from "./needsOnboarding";

const empty = { purposes: [], routePrefs: [] };
const base = { signedIn: true, preferences: empty, skipLoaded: true, skipped: false };

describe("needsOnboarding", () => {
  it("로그인했고 설문 답이 없으면 보여 준다", () => {
    expect(needsOnboarding(base)).toBe(true);
  });

  it("비로그인이면 보여 주지 않는다", () => {
    expect(needsOnboarding({ ...base, signedIn: false })).toBe(false);
  });

  it("설문 답을 아직 못 읽었으면 보여 주지 않는다", () => {
    expect(needsOnboarding({ ...base, preferences: undefined })).toBe(false);
  });

  it("건너뛴 기록을 읽기 전이거나 건너뛰었으면 보여 주지 않는다", () => {
    expect(needsOnboarding({ ...base, skipLoaded: false })).toBe(false);
    expect(needsOnboarding({ ...base, skipped: true })).toBe(false);
  });

  it("이미 답했으면 보여 주지 않는다", () => {
    expect(needsOnboarding({ ...base, preferences: { purposes: ["TRAVEL"], routePrefs: ["FAST"] } })).toBe(false);
  });
});
