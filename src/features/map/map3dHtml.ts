import { ARROW_SPACING_PX, DEFAULT_CENTER, DEFAULT_ZOOM, LONG_PRESS_MS, LONG_PRESS_SLOP_PX } from "./mapHtml";

/** 3D 지도가 처음 그려졌을 때 WebView가 앱에 보내는 메시지 */
export const MAP_READY_MESSAGE = "ready";

/** 3D 지도의 기울기(도). 위에서 비스듬히 내려다본다 */
const TILT_DEGREES = 55;

/** 건물 3D를 그리기 시작하는 확대 수준. 그보다 멀면 평면 지도라 건물을 그리지 않는다 */
const BUILDING_MIN_ZOOM = 14;

/** 건물 높이를 모를 때 쓰는 값(m) */
const DEFAULT_BUILDING_HEIGHT = 12;

/** MapLibre GL JS를 unpkg에서 불러온다. 정확한 버전을 고정한다 */
const MAPLIBRE_CSS = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css";
const MAPLIBRE_JS = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";

/** OpenFreeMap의 밝은 회색 지도 스타일(OpenStreetMap 기반 벡터 타일, 키 없음) */
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

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
 * 색 없는 단순한 건물 덩어리로 그리는 3D 지도 페이지(MapLibre GL JS + OpenFreeMap, OpenStreetMap 기반).
 * 위성 질감 대신 회색 지도 위에 건물만 높이로 솟게 해 가볍다. 2D 페이지처럼 앱이 window.updateMap(데이터)을 불러 마커와 선을 바꾼다
 */
export function build3dMapHtml(): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="${MAPLIBRE_CSS}" />
<style>
  html, body, #map { margin: 0; height: 100%; width: 100%; background: #E5E8EB; }
  .dot { box-sizing: border-box; border: 2px solid #fff; border-radius: 50%; }
  .tag { position: absolute; left: 50%; bottom: 100%; transform: translate(-50%, -4px); white-space: nowrap; font: 600 12px sans-serif; color: #191F28; background: rgba(255,255,255,0.9); padding: 1px 5px; border-radius: 4px; }
</style>
<script>
  function send(message) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }
  window.onerror = function (m, s, l) { send({ type: "error", message: m + " @" + s + ":" + l }); };
</script>
<script src="${MAPLIBRE_JS}"></script>
</head>
<body>
<div id="map"></div>
<script>
  var DEFAULT_CENTER = [${DEFAULT_CENTER[1]}, ${DEFAULT_CENTER[0]}];
  var GHOST = "data:image/svg+xml," + encodeURIComponent('${GHOST_SVG}');
  var PIN = "data:image/svg+xml," + encodeURIComponent('${PIN_SVG}');
  var ready = false;
  var pendingData = null;
  var markerEls = [];
  var map = null;

  function startMap() {
    map = new maplibregl.Map({
      container: "map",
      style: "${STYLE_URL}",
      center: DEFAULT_CENTER,
      zoom: ${DEFAULT_ZOOM} - 1,
      pitch: ${TILT_DEGREES},
      maxPitch: 70,
      attributionControl: false
    });
    map.on("load", function () {
      // 평면 건물 대신 높이로 솟은 회색 덩어리를 그린다
      if (map.getLayer("building")) map.setLayoutProperty("building", "visibility", "none");
      map.addLayer({
        id: "building-3d", type: "fill-extrusion", source: "openmaptiles", "source-layer": "building", minzoom: ${BUILDING_MIN_ZOOM},
        paint: {
          "fill-extrusion-color": "#D5D9E0",
          "fill-extrusion-height": ["to-number", ["get", "render_height"], ${DEFAULT_BUILDING_HEIGHT}],
          "fill-extrusion-base": ["to-number", ["get", "render_min_height"], 0],
          "fill-extrusion-opacity": 0.92
        }
      });
      map.addSource("lines", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      var join = { "line-cap": "round", "line-join": "round" };
      map.addLayer({ id: "lines-border", type: "line", source: "lines", filter: ["==", ["get", "border"], true], layout: join,
        paint: { "line-color": "#FFFFFF", "line-width": ["+", ["get", "weight"], 4] } });
      map.addLayer({ id: "lines-solid", type: "line", source: "lines", filter: ["!=", ["get", "dashed"], true], layout: join,
        paint: { "line-color": ["get", "color"], "line-width": ["get", "weight"], "line-opacity": ["get", "opacity"] } });
      map.addLayer({ id: "lines-dashed", type: "line", source: "lines", filter: ["==", ["get", "dashed"], true], layout: { "line-join": "round" },
        paint: { "line-color": ["get", "color"], "line-width": ["get", "weight"], "line-opacity": ["get", "opacity"], "line-dasharray": [2, 2] } });
      map.addImage("route-arrow", arrowImage(), { pixelRatio: 2 });
      map.addLayer({ id: "lines-arrows", type: "symbol", source: "lines", filter: ["==", ["get", "arrows"], true],
        layout: { "symbol-placement": "line", "symbol-spacing": ${ARROW_SPACING_PX}, "icon-image": "route-arrow", "icon-allow-overlap": true, "icon-ignore-placement": true, "icon-rotation-alignment": "map", "icon-pitch-alignment": "viewport" } });
      setupLongPress();
      ready = true;
      if (pendingData) window.updateMap(pendingData);
      // 타일이 올라온 첫 순간을 앱에 알려 로딩 표시를 걷게 한다
      map.once("idle", function () { send({ type: "${MAP_READY_MESSAGE}" }); });
    });
    map.on("error", function (e) {
      send({ type: "error", message: "map " + (e && e.error && e.error.message) });
    });
  }

  // 선 위에 찍는 진행 방향 화살표. 2D와 같은 하얀 꺾쇠를 오른쪽 방향으로 그리고, 화면에 세운 채 선 방향으로만 돌려 쓴다
  function arrowImage() {
    var size = 32;
    var canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext("2d");
    ctx.translate(size / 2, size / 2);
    ctx.scale(2, 2);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(-2.6, -3.8);
    ctx.lineTo(2.4, 0);
    ctx.lineTo(-2.6, 3.8);
    ctx.stroke();
    return ctx.getImageData(0, 0, size, size);
  }

  function markerElement(m) {
    var el = document.createElement("div");
    if (m.kind === "me" || m.kind === "pin") {
      var img = document.createElement("img");
      img.src = m.kind === "me" ? GHOST : PIN;
      img.style.width = (m.kind === "me" ? 21 : 27) + "px";
      img.style.display = "block";
      el.appendChild(img);
      return { el: el, anchor: "bottom" };
    }
    var size = (m.radius || 5) * 2 + 4;
    el.className = "dot";
    el.style.width = size + "px";
    el.style.height = size + "px";
    el.style.background = m.color;
    if (m.label) {
      var tag = document.createElement("div");
      tag.className = "tag";
      tag.textContent = m.label;
      el.appendChild(tag);
    }
    return { el: el, anchor: "center" };
  }

  function applyData(data) {
    var points = [];
    var features = [];
    (data.lines || []).forEach(function (line) {
      if (line.points.length < 2) return;
      var coords = line.points.map(function (p) { return [p[1], p[0]]; });
      if (!line.noFit) coords.forEach(function (c) { points.push(c); });
      features.push({ type: "Feature", properties: {
        color: line.color, weight: line.weight || 5, opacity: line.opacity == null ? 1 : line.opacity,
        dashed: !!line.dashed, border: !!line.border && !line.dashed, arrows: !!line.arrows && !line.dashed
      }, geometry: { type: "LineString", coordinates: coords } });
    });
    map.getSource("lines").setData({ type: "FeatureCollection", features: features });

    markerEls.forEach(function (m) { m.remove(); });
    markerEls = [];
    (data.markers || []).forEach(function (m) {
      points.push([m.lng, m.lat]);
      var made = markerElement(m);
      markerEls.push(new maplibregl.Marker({ element: made.el, anchor: made.anchor }).setLngLat([m.lng, m.lat]).addTo(map));
    });

    var padding = { top: (data.topInset || 0) + 60, bottom: (data.bottomInset || 0) + 60, left: 50, right: 50 };
    var focusPoints = data.focus && data.focus.length > 0 ? data.focus.map(function (p) { return [p[1], p[0]]; }) : null;
    var target = focusPoints || (data.fit ? points : null);
    if (target && target.length > 0) {
      var bounds = target.reduce(function (b, c) { return b.extend(c); }, new maplibregl.LngLatBounds(target[0], target[0]));
      map.fitBounds(bounds, { padding: padding, maxZoom: 17, pitch: ${TILT_DEGREES}, duration: 0 });
    } else if (data.center) {
      map.jumpTo({ center: [data.center[1], data.center[0]], zoom: (data.zoom || ${DEFAULT_ZOOM}) - 1, pitch: ${TILT_DEGREES}, padding: { top: data.topInset || 0, bottom: data.bottomInset || 0, left: 0, right: 0 } });
    }
  }

  window.updateMap = function (data) {
    if (!ready) { pendingData = data; return; }
    try { applyData(data); } catch (e) { send({ type: "error", message: "applyData " + e.message }); }
  };

  function setupLongPress() {
    var canvas = map.getCanvas();
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
        var at = map.unproject([start.x - rect.left, start.y - rect.top]);
        send({ type: "longPress", lat: at.lat, lng: at.lng });
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

  try { startMap(); } catch (e) { send({ type: "error", message: "init " + e.message }); }
</script>
</body>
</html>`;
}
