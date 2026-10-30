import { GHOST_MARKER_INNER } from "./ghostMarker";
import {
  ARROW_SPACING_PX,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  LONG_PRESS_MS,
  LONG_PRESS_SLOP_PX,
  ME_CONE_CSS,
  ME_CONE_SCRIPT,
  ME_CONE_SVG,
} from "./mapHtml";

/** 3D 지도가 처음 그려졌을 때 WebView가 앱에 보내는 메시지 */
export const MAP_READY_MESSAGE = "ready";

/** 3D 지도의 기울기(도). 위에서 비스듬히 내려다본다 */
const TILT_DEGREES = 55;

/** 건물 3D를 그리기 시작하는 확대 수준. 그보다 멀면 평면 지도라 건물을 그리지 않는다 */
const BUILDING_MIN_ZOOM = 14;

/** 건물 높이를 모를 때 쓰는 값(m) */
const DEFAULT_BUILDING_HEIGHT = 12;

/** 내 위치가 바뀔 때 유령이 미끄러지듯 옮겨 가는 시간(ms). 이보다 먼 거리(m)는 옮겨 가지 않고 바로 놓는다 */
const ME_MOVE_MS = 900;
const ME_JUMP_METERS = 2000;

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
  /* 2D 지도와 같은 내 위치 표시(맥동, 떠 있는 유령)와 바라보는 방향 부채꼴 */
  .me-wrap { position: relative; width: 80px; height: 80px; }
  .me-halo { position: absolute; left: 27px; top: 27px; width: 26px; height: 26px; border-radius: 50%; background: #002968; opacity: 0.22; animation: pulse 1.8s ease-out infinite; }
  .me-shadow { position: absolute; left: 32px; top: 40px; width: 16px; height: 5px; border-radius: 50%; background: #191F28; opacity: 0.15; }
  .me-ghost { position: absolute; left: 30px; top: 18px; width: 21px; height: 24px; animation: hover 1.8s ease-in-out infinite; }
  ${ME_CONE_CSS}
  @keyframes pulse { 0% { transform: scale(1); opacity: 0.22; } 100% { transform: scale(2.8); opacity: 0; } }
  @keyframes hover { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1.6px); } }
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
  var GHOST_FACES = ${JSON.stringify(GHOST_MARKER_INNER)};
  function ghostSrc(mood) {
    var inner = GHOST_FACES[mood] || GHOST_FACES.NORMAL;
    return "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="42" height="48" viewBox="10 8 44 50" fill="none">' + inner + '</svg>');
  }
  var PIN = "data:image/svg+xml," + encodeURIComponent('${PIN_SVG}');
  var ready = false;
  var pendingData = null;
  var markerEls = [];
  var map = null;
  var meMarker = null;
  var meAnim = 0;
  var meMood = null;

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
      map.on("rotate", applyCone);
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
    if (m.kind === "pin") {
      var img = document.createElement("img");
      img.src = PIN;
      img.style.width = "27px";
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

  // 내 위치는 마커를 계속 두고 위치만 옮긴다. 가까운 이동은 미끄러지듯, 먼 이동은 바로 놓는다
  function meElement(mood) {
    var el = document.createElement("div");
    el.className = "me-wrap";
    el.innerHTML = ${JSON.stringify(ME_CONE_SVG)} +
      '<div class="me-halo"></div><div class="me-shadow"></div><img class="me-ghost" src="' + ghostSrc(mood) + '" />';
    return el;
  }

  function bearingOf() { return map ? map.getBearing() : 0; }
  ${ME_CONE_SCRIPT}

  function metersBetween(a, b) {
    var dLat = (a.lat - b.lat) * 111320;
    var dLng = (a.lng - b.lng) * 111320 * Math.cos(a.lat * Math.PI / 180);
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }

  function placeMe(lng, lat, mood) {
    if (!meMarker) {
      meMarker = new maplibregl.Marker({ element: meElement(mood), anchor: "center" }).setLngLat([lng, lat]).addTo(map);
      meMood = mood;
      applyCone();
      return;
    }
    if (mood !== meMood) {
      meMood = mood;
      meMarker.getElement().querySelector(".me-ghost").src = ghostSrc(mood);
    }
    var from = meMarker.getLngLat();
    var to = { lng: lng, lat: lat };
    if (meAnim) cancelAnimationFrame(meAnim);
    if (metersBetween(from, to) < 0.5 || metersBetween(from, to) > ${ME_JUMP_METERS}) { meMarker.setLngLat([lng, lat]); return; }
    var startedAt = performance.now();
    function step(now) {
      var t = Math.min(1, (now - startedAt) / ${ME_MOVE_MS});
      var eased = 1 - Math.pow(1 - t, 3);
      meMarker.setLngLat([from.lng + (to.lng - from.lng) * eased, from.lat + (to.lat - from.lat) * eased]);
      meAnim = t < 1 ? requestAnimationFrame(step) : 0;
    }
    meAnim = requestAnimationFrame(step);
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
    var me = null;
    (data.markers || []).forEach(function (m) {
      points.push([m.lng, m.lat]);
      if (m.kind === "me") { me = m; return; }
      var made = markerElement(m);
      markerEls.push(new maplibregl.Marker({ element: made.el, anchor: made.anchor }).setLngLat([m.lng, m.lat]).addTo(map));
    });

    if (me) placeMe(me.lng, me.lat, me.mood);
    else if (meMarker) { meMarker.remove(); meMarker = null; }

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
