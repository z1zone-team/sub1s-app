import { GHOST_MARKER_INNER, type GhostMood } from "./ghostMarker";
import { LABEL_OVERLAY_LAYER, type TileLayerName } from "./mapStyle";

/** Leaflet 1.9.4를 cdnjs에서 불러온다. 정확한 버전을 고정한다 */
const LEAFLET_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
const LEAFLET_JS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";

export interface MapMarker {
  lat: number;
  lng: number;
  color: string;
  /** 지도 위에 항상 보이는 이름. 없으면 점만 그린다 */
  label?: string;
  radius?: number;
  /** "me"면 점 대신 프로토타입의 캐릭터와 맥동 효과로, "pin"이면 지도 검색에서 고른 장소의 핀으로 그린다 */
  kind?: "me" | "pin";
  /** kind가 "me"일 때 캐릭터의 표정. 이번 달 이동 거리로 정하고, 없으면 보통 */
  mood?: GhostMood;
}

export interface MapLine {
  color: string;
  points: Array<[number, number]>;
  weight?: number;
  opacity?: number;
  /** 점선. 도보 구간처럼 열차가 아닌 이동을 나타낸다 */
  dashed?: boolean;
  /** 지도를 맞출 때 이 선은 빼고 계산한다. 배경으로만 흐리게 깔 때 쓴다 */
  noFit?: boolean;
  /** 선 아래에 흰 테두리를 깐다. 점선에는 쓰지 않는다 */
  border?: boolean;
  /** 선 위에 진행 방향(points 순서) 화살표를 일정 간격으로 찍는다 */
  arrows?: boolean;
}

/** 선 테두리가 선 양쪽으로 더하는 굵기(px) */
export const LINE_BORDER_PX = 2;
/** 화살표 사이의 화면 간격(px) */
export const ARROW_SPACING_PX = 64;

export interface MapData {
  markers: MapMarker[];
  lines: MapLine[];
  /** 모든 마커와 선이 보이게 맞출지. 아니면 center를 쓴다 */
  fit: boolean;
  /** 맞출 때나 중심을 잡을 때 아래를 이만큼(px) 더 비운다. 지도 위에 바텀시트가 얹힐 때 쓴다 */
  bottomInset?: number;
  /** 중심을 잡을 때 위를 이만큼(px) 덮은 것으로 본다. 지도 위에 배너가 얹힐 때 쓴다 */
  topInset?: number;
  center?: [number, number];
  zoom?: number;
  /**
   * 있으면 이 좌표들이 한눈에 보이게 확대한다(구간이나 역을 눌렀을 때). 좌표가 하나면 그 점을 가운데에 두고 크게 보여 준다.
   * fit과 center보다 우선한다
   */
  focus?: Array<[number, number]>;
}

/** 지도를 길게 눌렀을 때 WebView가 앱에 보내는 메시지 */
export interface MapLongPress {
  lat: number;
  lng: number;
}

/** WebView 메시지에서 길게 누른 좌표를 꺼낸다. 형식이 맞지 않으면 null */
export function parseMapLongPress(raw: string): MapLongPress | null {
  try {
    const message = JSON.parse(raw) as { type?: unknown; lat?: unknown; lng?: unknown };
    if (message.type !== "longPress") return null;
    const { lat, lng } = message;
    if (typeof lat !== "number" || typeof lng !== "number") return null;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

/** 내 위치 표시 뒤에 깔리는 바라보는 방향 부채꼴(시야). 위쪽(북쪽)을 향해 그려 두고 돌려서 쓴다 */
export const ME_CONE_SVG =
  '<svg class="me-cone" viewBox="0 0 80 80"><defs><radialGradient id="cone" cx="40" cy="40" r="38" gradientUnits="userSpaceOnUse">' +
  '<stop offset="0" stop-color="#2F6BFF" stop-opacity="0.55"/><stop offset="1" stop-color="#2F6BFF" stop-opacity="0"/></radialGradient></defs>' +
  '<path d="M40 40 L22.2 6.4 A38 38 0 0 1 57.8 6.4 Z" fill="url(#cone)"/></svg>';

/** 부채꼴 스타일. 돌리는 것은 페이지 스크립트가 프레임마다 하므로 CSS 전환은 쓰지 않는다 */
export const ME_CONE_CSS = ".me-cone { position: absolute; left: 0; top: 0; width: 80px; height: 80px; display: none; }";

/** 프레임마다 보이는 각도가 목표 각도와의 차이의 이만큼을 따라간다. 클수록 빠르게 따라가지만 센서 떨림이 보인다 */
const CONE_FOLLOW_RATIO = 0.3;

/**
 * 부채꼴을 돌리는 페이지 안 스크립트. 페이지가 지도의 회전각을 돌려주는 bearingOf()를 먼저 정의해야 한다.
 * 센서 값은 초당 10번쯤 뚝뚝 오므로 프레임마다 목표 각도로 다가가며 돌리고, 359도에서 1도로 넘어갈 때 한 바퀴 돌지 않게 누적한 각도를 쓴다.
 * 방향을 모르면(null) 숨긴다
 */
export const ME_CONE_SCRIPT = `
  var heading = null;
  var targetAngle = null;
  var shownAngle = null;
  var coneRaf = 0;
  function renderCone() {
    var cones = document.querySelectorAll(".me-cone");
    for (var i = 0; i < cones.length; i++) {
      cones[i].style.display = shownAngle === null ? "none" : "block";
      if (shownAngle !== null) cones[i].style.transform = "rotate(" + shownAngle + "deg)";
    }
  }
  function stepCone() {
    coneRaf = 0;
    var diff = targetAngle - shownAngle;
    shownAngle = Math.abs(diff) < 0.2 ? targetAngle : shownAngle + diff * ${CONE_FOLLOW_RATIO};
    renderCone();
    if (shownAngle !== targetAngle) coneRaf = requestAnimationFrame(stepCone);
  }
  function applyCone() {
    if (heading === null) { targetAngle = null; shownAngle = null; renderCone(); return; }
    var target = heading - bearingOf();
    targetAngle = targetAngle === null ? target : targetAngle + ((((target - targetAngle) % 360) + 540) % 360 - 180);
    if (shownAngle === null) shownAngle = targetAngle;
    renderCone();
    if (!coneRaf && shownAngle !== targetAngle) coneRaf = requestAnimationFrame(stepCone);
  }
  window.setHeading = function (value) {
    heading = typeof value === "number" ? value : null;
    applyCone();
  };
`;

export const LONG_PRESS_MS = 600;
export const LONG_PRESS_SLOP_PX = 10;

export const DEFAULT_CENTER: [number, number] = [37.5665, 126.978];
export const DEFAULT_ZOOM = 12;
/** 구간이나 역을 눌렀을 때 확대하는 최대 수준 */
export const FOCUS_ZOOM = 17;

/**
 * V-World 타일(WMTS)을 Leaflet으로 그리는 페이지. 앱이 window.updateMap(데이터)을 불러 마커와 선을 바꾼다.
 * 키는 주소에 들어가므로 URL 인코딩한다.
 */
export function buildMapHtml(vworldKey: string, layer: TileLayerName = { name: "Base", extension: "png" }, labelOverlay = false): string {
  const key = encodeURIComponent(vworldKey);
  const tileUrl = (target: TileLayerName) => `https://api.vworld.kr/req/wmts/1.0.0/${key}/${target.name}/{z}/{y}/{x}.${target.extension}`;
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="${LEAFLET_CSS}" />
<style>
  html, body, #map { margin: 0; height: 100%; width: 100%; }
  .label { background: rgba(255,255,255,0.9); border: 0; border-radius: 8px; padding: 1px 6px; font: 600 11px sans-serif; color: #191F28; box-shadow: none; }
  /* 프로토타입 Main.dc.html의 내 위치 표시. 지도 1단위가 약 2.13px이라 유령은 0.22배 -> 약 20 x 23px */
  .me-wrap { position: relative; width: 80px; height: 80px; }
  ${ME_CONE_CSS}
  .me-halo { position: absolute; left: 27px; top: 27px; width: 26px; height: 26px; border-radius: 50%; background: #002968; opacity: 0.22; animation: pulse 1.8s ease-out infinite; }
  .me-shadow { position: absolute; left: 32px; top: 40px; width: 16px; height: 5px; border-radius: 50%; background: #191F28; opacity: 0.15; }
  .me-ghost { position: absolute; left: 30px; top: 18px; width: 21px; height: 24px; overflow: visible; animation: hover 1.8s ease-in-out infinite; }
  @keyframes pulse { 0% { transform: scale(1); opacity: 0.22; } 100% { transform: scale(2.8); opacity: 0; } }
  @keyframes hover { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1.6px); } }
  .pin-icon { filter: drop-shadow(0 2px 3px rgba(17, 24, 39, 0.35)); }
  #error { display: none; padding: 16px; font: 14px sans-serif; color: #4E5968; }
</style>
</head>
<body>
<div id="map"></div>
<div id="error">지도를 불러오지 못했어요</div>
<script src="${LEAFLET_JS}"></script>
<script>
  if (!window.L) {
    document.getElementById("map").style.display = "none";
    document.getElementById("error").style.display = "block";
  } else {
    var map = L.map("map", { zoomControl: false, attributionControl: false }).setView([${DEFAULT_CENTER[0]}, ${DEFAULT_CENTER[1]}], ${DEFAULT_ZOOM});
    L.tileLayer("${tileUrl(layer)}", { maxZoom: 19, detectRetina: true }).addTo(map);
    ${labelOverlay ? `L.tileLayer("${tileUrl(LABEL_OVERLAY_LAYER)}", { maxZoom: 19, detectRetina: true }).addTo(map);` : ""}
    var layer = L.layerGroup().addTo(map);
    // 진행 방향 화살표. 확대 수준마다 화면 간격이 달라 따로 두고 다시 그린다
    var arrowLayer = L.layerGroup().addTo(map);
    var arrowLines = [];
    function arrowIcon(angle, color) {
      return L.divIcon({
        className: "",
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        html: '<svg width="16" height="16" viewBox="-8 -8 16 16" style="transform: rotate(' + angle + 'deg); overflow: visible">' +
          '<path d="M-2.6 -3.8 L2.4 0 L-2.6 3.8" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      });
    }
    function drawArrows() {
      arrowLayer.clearLayers();
      var view = map.getBounds().pad(0.2);
      arrowLines.forEach(function (line) {
        var pts = line.points.map(function (p) { return map.latLngToLayerPoint(p); });
        var next = ${ARROW_SPACING_PX} / 2;
        var travelled = 0;
        for (var i = 1; i < pts.length; i += 1) {
          var a = pts[i - 1];
          var b = pts[i];
          var length = a.distanceTo(b);
          if (length === 0) continue;
          var angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
          while (travelled + length >= next) {
            var t = (next - travelled) / length;
            var at = map.layerPointToLatLng(L.point(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t));
            if (view.contains(at)) L.marker(at, { icon: arrowIcon(angle, line.color), interactive: false, keyboard: false }).addTo(arrowLayer);
            next += ${ARROW_SPACING_PX};
          }
          travelled += length;
        }
      });
    }
    map.on("zoomend moveend", drawArrows);
    var GHOST_FACES = ${JSON.stringify(GHOST_MARKER_INNER)};
    function meIcon(mood) {
      return L.divIcon({
        className: "",
        iconSize: [80, 80],
        iconAnchor: [40, 40],
        html: '<div class="me-wrap">' + ${JSON.stringify(ME_CONE_SVG)} + '<div class="me-halo"></div><div class="me-shadow"></div>' +
          '<svg class="me-ghost" viewBox="10 8 44 50" fill="none">' + (GHOST_FACES[mood] || GHOST_FACES.NORMAL) + '</svg></div>'
      });
    }
    var PIN_ICON = L.divIcon({
      className: "",
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      html: '<svg class="pin-icon" width="32" height="40" viewBox="0 0 24 30" fill="none">' +
        '<path d="M12 1.5C6.8 1.5 2.5 5.7 2.5 10.9c0 6.7 9.5 17.6 9.5 17.6s9.5-10.9 9.5-17.6C21.5 5.7 17.2 1.5 12 1.5z" fill="#002968" stroke="#FFFFFF" stroke-width="1.6" stroke-linejoin="round"/>' +
        '<circle cx="12" cy="10.8" r="3.6" fill="#FFFFFF"/></svg>'
    });
    var pressTimer = null;
    var pressStart = null;
    var mapEl = map.getContainer();
    function cancelPress() {
      if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
    }
    mapEl.addEventListener("touchstart", function (e) {
      cancelPress();
      if (e.touches.length !== 1) return;
      pressStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      pressTimer = setTimeout(function () {
        pressTimer = null;
        var rect = mapEl.getBoundingClientRect();
        var latlng = map.containerPointToLatLng([pressStart.x - rect.left, pressStart.y - rect.top]);
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: "longPress", lat: latlng.lat, lng: latlng.lng }));
        }
      }, ${LONG_PRESS_MS});
    }, { passive: true });
    mapEl.addEventListener("touchmove", function (e) {
      if (!pressTimer) return;
      var dx = e.touches[0].clientX - pressStart.x;
      var dy = e.touches[0].clientY - pressStart.y;
      if (Math.sqrt(dx * dx + dy * dy) > ${LONG_PRESS_SLOP_PX}) cancelPress();
    }, { passive: true });
    mapEl.addEventListener("touchend", cancelPress, { passive: true });
    mapEl.addEventListener("touchcancel", cancelPress, { passive: true });
    mapEl.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    function bearingOf() { return 0; }
    ${ME_CONE_SCRIPT}
    window.updateMap = function (data) {
      layer.clearLayers();
      arrowLines = [];
      var bounds = [];
      (data.lines || []).forEach(function (line) {
        if (line.points.length < 2) return;
        var weight = line.weight || 5;
        if (line.border && !line.dashed) {
          L.polyline(line.points, { color: "#FFFFFF", weight: weight + ${LINE_BORDER_PX} * 2, opacity: line.opacity == null ? 1 : line.opacity, lineCap: "round", lineJoin: "round" }).addTo(layer);
        }
        L.polyline(line.points, { color: line.color, weight: weight, opacity: line.opacity == null ? 1 : line.opacity, lineCap: "round", lineJoin: "round", dashArray: line.dashed ? "2 10" : null }).addTo(layer);
        if (line.arrows && !line.dashed) arrowLines.push(line);
        if (!line.noFit) line.points.forEach(function (p) { bounds.push(p); });
      });
      (data.markers || []).forEach(function (m) {
        if (m.kind === "pin") {
          L.marker([m.lat, m.lng], { icon: PIN_ICON, interactive: false, keyboard: false }).addTo(layer);
          bounds.push([m.lat, m.lng]);
          return;
        }
        if (m.kind === "me") {
          L.marker([m.lat, m.lng], { icon: meIcon(m.mood), interactive: false, keyboard: false }).addTo(layer);
          applyCone();
          bounds.push([m.lat, m.lng]);
          return;
        }
        var circle = L.circleMarker([m.lat, m.lng], { radius: m.radius || 5, color: "#FFFFFF", weight: 2, fillColor: m.color, fillOpacity: 1 }).addTo(layer);
        if (m.label) circle.bindTooltip(m.label, { permanent: true, direction: "top", offset: [0, -6], className: "label" });
        bounds.push([m.lat, m.lng]);
      });
      if (data.focus && data.focus.length > 0) {
        if (data.focus.length === 1) {
          map.setView(data.focus[0], ${FOCUS_ZOOM});
          var focusShift = ((data.bottomInset || 0) - (data.topInset || 0)) / 2;
          if (focusShift) map.panBy([0, focusShift], { animate: false });
        } else {
          map.fitBounds(data.focus, { paddingTopLeft: [32, 32 + (data.topInset || 0)], paddingBottomRight: [32, 32 + (data.bottomInset || 0)], maxZoom: ${FOCUS_ZOOM} });
        }
      } else if (data.fit && bounds.length > 0) {
        map.fitBounds(bounds, { paddingTopLeft: [32, 32 + (data.topInset || 0)], paddingBottomRight: [32, 32 + (data.bottomInset || 0)], maxZoom: 15 });
      } else if (data.center) {
        map.setView(data.center, data.zoom || ${DEFAULT_ZOOM});
        // 위의 배너와 아래의 시트가 덮은 만큼을 빼고 보이는 영역의 가운데에 중심점이 오도록 지도를 옮긴다
        var shift = ((data.bottomInset || 0) - (data.topInset || 0)) / 2;
        if (shift) map.panBy([0, shift], { animate: false });
      }
      drawArrows();
    };
  }
</script>
</body>
</html>`;
}
