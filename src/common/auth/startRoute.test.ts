import { resolveStartRoute } from "./startRoute";

const base = { authLoaded: true, signedIn: false, guestLoaded: true, guestChosen: false };

describe("resolveStartRoute", () => {
  it("인증 상태나 둘러보기 선택을 읽는 동안은 로딩이다", () => {
    expect(resolveStartRoute({ ...base, authLoaded: false })).toBe("LOADING");
    expect(resolveStartRoute({ ...base, guestLoaded: false })).toBe("LOADING");
  });

  it("로그인도 둘러보기 선택도 없으면 로그인 화면이다", () => {
    expect(resolveStartRoute(base)).toBe("LOGIN");
  });

  it("로그인했으면 홈이다", () => {
    expect(resolveStartRoute({ ...base, signedIn: true })).toBe("MAIN");
  });

  it("둘러보기를 골랐으면 홈이다", () => {
    expect(resolveStartRoute({ ...base, guestChosen: true })).toBe("MAIN");
  });

  it("로그인 서비스가 시간 안에 응답하지 않으면 로그인하지 않은 상태로 시작한다", () => {
    expect(resolveStartRoute({ ...base, authLoaded: false, authTimedOut: true })).toBe("LOGIN");
    expect(resolveStartRoute({ ...base, authLoaded: false, authTimedOut: true, guestChosen: true })).toBe("MAIN");
  });

  it("시간이 지나도 둘러보기 선택을 읽는 동안은 로딩이다", () => {
    expect(resolveStartRoute({ ...base, authLoaded: false, guestLoaded: false, authTimedOut: true })).toBe("LOADING");
  });
});
