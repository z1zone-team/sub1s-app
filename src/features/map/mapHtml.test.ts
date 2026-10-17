import { buildMapHtml, LONG_PRESS_MS, parseMapLongPress } from "./mapHtml";

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
