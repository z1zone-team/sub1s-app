import { DEFAULT_CENTER, DEFAULT_ZOOM, LONG_PRESS_MS, LONG_PRESS_SLOP_PX } from "./mapHtml";
import type { TileLayerName } from "./mapStyle";

/** 3D 지도가 처음 그려졌을 때 WebView가 앱에 보내는 메시지 */
export const MAP_READY_MESSAGE = "ready";

/** 3D 지도의 기울기(도). 위에서 비스듬히 내려다본다 */
const TILT_DEGREES = 45;

/** 3D 화면을 그리는 최대 배율. 기기 화소 밀도를 따르되 이 값을 넘기지 않는다(성능) */
const MAX_RESOLUTION_SCALE = 2.5;

/** 지도 타일을 고르는 화면 오차(px). 작을수록 선명하지만 더 많이 내려받는다. 기본은 2 */
const MAX_SCREEN_SPACE_ERROR = 1;

/** 확대 수준을 카메라 거리(m)로 바꾸는 상수. 2D 지도와 비슷한 크기로 보이게 맞춘 값 */
const RANGE_AT_ZOOM_0 = 30_000_000;

export function isMapReadyMessage(raw: string): boolean {
  try {
    return (JSON.parse(raw) as { type?: unknown }).type === MAP_READY_MESSAGE;
  } catch {
    return false;
  }
}

const GHOST_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="42" height="48" viewBox="10 8 44 50" fill="none">' +
  '<path d="M12 46V28a18 18 0 0 1 36 0v16C48 47 49.5 49 52 50.5C53.5 51.5 52.5 53.5 50 53.5C47.5 53.5 46.5 51.5 44.5 51.8C42.5 52.1 42 55 39 55C36 55 35.5 52.2 33 52.4C30.5 52.6 30 55.5 26.8 55.5C23.6 55.5 23.2 52.6 20.8 52.6C18 52.6 16.5 54 14.6 53C12.6 52 12 49.5 12 46z" fill="#FFFFFF" stroke="#002968" stroke-width="3.4" stroke-linejoin="round"/>' +
  '<circle cx="24" cy="29" r="3.4" fill="#002968"/><circle cx="36" cy="29" r="3.4" fill="#002968"/>' +
  '<path d="M26.5 36.5q3.5 3 7 0" stroke="#002968" stroke-width="2.6" stroke-linecap="round"/></svg>';

const PIN_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 24 30" fill="none">' +
  '<path d="M12 1.5C6.8 1.5 2.5 5.7 2.5 10.9c0 6.7 9.5 17.6 9.5 17.6s9.5-10.9 9.5-17.6C21.5 5.7 17.2 1.5 12 1.5z" fill="#002968" stroke="#FFFFFF" stroke-width="1.6" stroke-linejoin="round"/>' +
  '<circle cx="12" cy="10.8" r="3.6" fill="#FFFFFF"/></svg>';

/**
 * V-World WebGL 3D 지도(API 3.0)로 그리는 페이지. 2D 페이지처럼 앱이 window.updateMap(데이터)을 불러 마커와 선을 바꾼다.
 * 기본 지도는 위성 사진이라, 처음 그려질 때 고른 스타일의 타일(Base 등)로 바꿔 끼운다.
 * 지도 API가 도메인 확인을 하므로 domain을 함께 넘긴다.
 */
export function build3dMapHtml(vworldKey: string, domain: string, layer: TileLayerName): string {
  const key = encodeURIComponent(vworldKey);
  const domainParam = domain ? `&domain=${encodeURIComponent(domain)}` : "";
  const tileUrl = `https://api.vworld.kr/req/wmts/1.0.0/${key}/${layer.name}/{z}/{y}/{x}.${layer.extension}`;
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>html, body, #vmap { margin: 0; height: 100%; width: 100%; background: #E5E8EB; }</style>
<script>
  function send(message) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }
  window.onerror = function (m, s, l) { send({ type: "error", message: m + " @" + s + ":" + l }); };
</script>
<script src="https://map.vworld.kr/js/webglMapInit.js.do?version=3.0&apiKey=${key}${domainParam}"></script>
</head>
<body>
<div id="vmap"></div>
<script>
  var viewer = null;
  var pendingData = null;
  var ready = false;
  var GHOST = "data:image/svg+xml," + encodeURIComponent('${GHOST_SVG}');
  var PIN = "data:image/svg+xml," + encodeURIComponent('${PIN_SVG}');
  var DEFAULT_CENTER = [${DEFAULT_CENTER[1]}, ${DEFAULT_CENTER[0]}];

  function rangeOf(zoom) { return ${RANGE_AT_ZOOM_0} / Math.pow(2, zoom); }

  var lastView = null;

  function lookAt(lng, lat, range) {
    lastView = [lng, lat, range];
    var camera = viewer.camera;
    camera.lookAt(Cesium.Cartesian3.fromDegrees(lng, lat, 0), new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-${TILT_DEGREES}), range));
    camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  }

  function applyData(data) {
    viewer.entities.removeAll();
    var points = [];
    (data.lines || []).forEach(function (line) {
      if (line.points.length < 2) return;
      var positions = [];
      line.points.forEach(function (p) { positions.push(p[1], p[0]); points.push([p[1], p[0]]); });
      var color = Cesium.Color.fromCssColorString(line.color).withAlpha(line.opacity == null ? 1 : line.opacity);
      viewer.entities.add({
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray(positions),
          width: line.weight || 5,
          clampToGround: true,
          material: line.dashed ? new Cesium.PolylineDashMaterialProperty({ color: color, dashLength: 14 }) : color
        }
      });
    });
    (data.markers || []).forEach(function (m) {
      var position = Cesium.Cartesian3.fromDegrees(m.lng, m.lat, 0);
      points.push([m.lng, m.lat]);
      if (m.kind === "me" || m.kind === "pin") {
        viewer.entities.add({
          position: position,
          billboard: {
            image: m.kind === "me" ? GHOST : PIN,
            scale: m.kind === "me" ? 0.5 : 0.85,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });
        return;
      }
      viewer.entities.add({
        position: position,
        point: { pixelSize: (m.radius || 5) * 2, color: Cesium.Color.fromCssColorString(m.color), outlineColor: Cesium.Color.WHITE, outlineWidth: 2, disableDepthTestDistance: Number.POSITIVE_INFINITY },
        label: m.label ? { text: m.label, font: "600 12px sans-serif", fillColor: Cesium.Color.fromCssColorString("#191F28"), showBackground: true, backgroundColor: Cesium.Color.WHITE.withAlpha(0.9), pixelOffset: new Cesium.Cartesian2(0, -14), disableDepthTestDistance: Number.POSITIVE_INFINITY } : undefined
      });
    });
    if (data.fit && points.length > 0) {
      var cartesians = points.map(function (p) { return Cesium.Cartesian3.fromDegrees(p[0], p[1], 0); });
      var sphere = Cesium.BoundingSphere.fromPoints(cartesians);
      var center = Cesium.Cartographic.fromCartesian(sphere.center);
      // 아래를 바텀시트가 덮으므로 여유를 두고 멀리서 본다
      var range = Math.max(sphere.radius * 3.2, rangeOf(16)) * (1 + (data.bottomInset || 0) / 600);
      lookAt(Cesium.Math.toDegrees(center.longitude), Cesium.Math.toDegrees(center.latitude), range);
    } else if (data.center) {
      lookAt(data.center[1], data.center[0], rangeOf(data.zoom || ${DEFAULT_ZOOM}));
    }
  }

  window.updateMap = function (data) {
    if (!ready) { pendingData = data; return; }
    try { applyData(data); } catch (e) { send({ type: "error", message: "applyData " + e.message }); }
  };

  function setupLongPress() {
    var canvas = viewer.scene.canvas;
    var timer = null;
    var start = null;
    function cancel() { if (timer) { clearTimeout(timer); timer = null; } }
    canvas.addEventListener("touchstart", function (e) {
      cancel();
      if (e.touches.length !== 1) return;
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      timer = setTimeout(function () {
        timer = null;
        var rect = canvas.getBoundingClientRect();
        var ground = viewer.camera.pickEllipsoid(new Cesium.Cartesian2(start.x - rect.left, start.y - rect.top), viewer.scene.globe.ellipsoid);
        if (!ground) return;
        var c = Cesium.Cartographic.fromCartesian(ground);
        send({ type: "longPress", lat: Cesium.Math.toDegrees(c.latitude), lng: Cesium.Math.toDegrees(c.longitude) });
      }, ${LONG_PRESS_MS});
    }, { passive: true });
    canvas.addEventListener("touchmove", function (e) {
      if (!timer) return;
      var dx = e.touches[0].clientX - start.x;
      var dy = e.touches[0].clientY - start.y;
      if (Math.sqrt(dx * dx + dy * dy) > ${LONG_PRESS_SLOP_PX}) cancel();
    }, { passive: true });
    canvas.addEventListener("touchend", cancel, { passive: true });
    canvas.addEventListener("touchcancel", cancel, { passive: true });
    canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  }

  function onViewer() {
    var layers = viewer.imageryLayers;
    for (var i = 0; i < layers.length; i++) layers.get(i).show = false;
    layers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({ url: "${tileUrl}", maximumLevel: 18 }));
    // 기본은 CSS 픽셀 기준이라 흐리다. 기기 화소 밀도로 그리고 더 촘촘한 지도 타일을 쓴다
    viewer.useBrowserRecommendedResolution = false;
    viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, ${MAX_RESOLUTION_SCALE});
    viewer.scene.globe.maximumScreenSpaceError = ${MAX_SCREEN_SPACE_ERROR};
    setupLongPress();
    lookAt(DEFAULT_CENTER[0], DEFAULT_CENTER[1], rangeOf(${DEFAULT_ZOOM}));
    ready = true;
    if (pendingData) window.updateMap(pendingData);
    // 타일이 모두 올라온 첫 순간을 앱에 알려 로딩 표시를 걷게 한다
    // V-World가 시작한 뒤 자체 초기 위치로 카메라를 옮기므로, 처음 몇 초 동안은 사용자가 지도를 만지기 전까지 마지막으로 맞춘 위치를 유지한다
    var touched = false;
    viewer.scene.canvas.addEventListener("touchstart", function () { touched = true; }, { passive: true });
    var holdUntil = Date.now() + 8000;
    var hold = setInterval(function () {
      if (touched || Date.now() > holdUntil) { clearInterval(hold); return; }
      if (lastView) lookAt(lastView[0], lastView[1], lastView[2]);
    }, 400);
    var done = false;
    viewer.scene.globe.tileLoadProgressEvent.addEventListener(function (remaining) {
      if (remaining !== 0 || done) return;
      done = true;
      send({ type: "${MAP_READY_MESSAGE}" });
    });
  }

  try {
    var map = new vw.Map();
    map.setOption({
      mapId: "vmap",
      initPosition: new vw.CameraPosition(new vw.CoordZ(${DEFAULT_CENTER[1]}, ${DEFAULT_CENTER[0]}, 3000), new vw.Direction(0, -${TILT_DEGREES}, 0)),
      logo: false,
      navigation: false
    });
    map.start();
    var poll = setInterval(function () {
      if (typeof ws3d === "undefined" || !ws3d.viewer) return;
      clearInterval(poll);
      viewer = ws3d.viewer;
      onViewer();
    }, 200);
  } catch (e) {
    send({ type: "error", message: "init " + e.message });
  }
</script>
</body>
</html>`;
}
