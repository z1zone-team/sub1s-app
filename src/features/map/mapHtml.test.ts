import { ARROW_SPACING_PX, buildMapHtml, FOCUS_ZOOM, LINE_BORDER_PX, LONG_PRESS_MS, parseMapLongPress } from "./mapHtml";

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

describe("buildMapHtml 선 스타일", () => {
  const html = buildMapHtml("KEY", { name: "Base", extension: "png" }, false);

  it("테두리가 있는 열차 선은 흰 테두리를 먼저 깔고 점선에는 깔지 않는다", () => {
    expect(html).toContain("line.border && !line.dashed");
    expect(html).toContain('color: "#FFFFFF", weight: weight + ' + LINE_BORDER_PX + " * 2");
  });

  it("화살표는 일정 간격으로 진행 방향에 찍고 확대나 이동, 데이터가 바뀔 때마다 다시 그린다", () => {
    expect(html).toContain("var next = " + ARROW_SPACING_PX + " / 2");
    expect(html).toContain('map.on("zoomend moveend", drawArrows)');
    expect(html).toMatch(/drawArrows\(\);\s*\};/);
    expect(html).toContain("if (line.arrows && !line.dashed) arrowLines.push(line)");
  });
});
