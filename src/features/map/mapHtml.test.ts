import { buildMapHtml, FOCUS_ZOOM, LONG_PRESS_MS, parseMapLongPress } from "./mapHtml";

describe("parseMapLongPress", () => {
  it("길게 누른 좌표를 꺼낸다", () => {
    expect(parseMapLongPress(JSON.stringify({ type: "longPress", lat: 37.4985, lng: 127.0278 }))).toEqual({
      lat: 37.4985,
      lng: 127.0278,
    });
  });

  it.each([
    ["JSON이 아닌 문자열", "hello"],
    ["다른 종류의 메시지", JSON.stringify({ type: "ready", lat: 37, lng: 127 })],
    ["좌표가 문자열", JSON.stringify({ type: "longPress", lat: "37", lng: "127" })],
    ["좌표가 없음", JSON.stringify({ type: "longPress" })],
    ["좌표가 null", JSON.stringify({ type: "longPress", lat: null, lng: null })],
  ])("형식이 맞지 않으면 null이다 (%s)", (_name, raw) => {
    expect(parseMapLongPress(raw)).toBeNull();
  });
});

describe("buildMapHtml 길게 누르기", () => {
  const html = buildMapHtml("key");

  it("길게 누르면 좌표를 앱으로 보내고 기본 길게 누르기 메뉴는 막는다", () => {
    expect(html).toContain("ReactNativeWebView.postMessage");
    expect(html).toContain('type: "longPress"');
    expect(html).toContain(`}, ${LONG_PRESS_MS});`);
    expect(html).toContain('"contextmenu"');
  });

  it("손가락이 움직이거나 두 손가락이면 취소한다", () => {
    expect(html).toContain('"touchmove"');
    expect(html).toContain("e.touches.length !== 1");
    expect(html).toContain('"touchend", cancelPress');
  });
});

describe("buildMapHtml 타일", () => {
  it("고밀도 화면에서 흐리지 않도록 선명한 타일을 쓴다", () => {
    expect(buildMapHtml("key")).toContain("detectRetina: true");
  });
});

describe("buildMapHtml focus", () => {
  const html = buildMapHtml("key");

  it("focus가 있으면 그 좌표들로 확대하고, fit과 center보다 먼저 처리한다", () => {
    expect(html).toContain("data.focus && data.focus.length > 0");
    expect(html.indexOf("data.focus && data.focus.length > 0")).toBeLessThan(html.indexOf("data.fit && bounds.length > 0"));
  });

  it("좌표가 하나면 그 점을 크게, 여럿이면 한눈에 보이게 맞추며 최대 확대를 넘지 않는다", () => {
    expect(html).toContain(`map.setView(data.focus[0], ${FOCUS_ZOOM})`);
    expect(html).toContain(`map.fitBounds(data.focus,`);
    expect(html).toContain(`maxZoom: ${FOCUS_ZOOM}`);
  });
});
