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
}

export interface MapLine {
  color: string;
  points: Array<[number, number]>;
  weight?: number;
  opacity?: number;
  /** 점선. 도보 구간처럼 열차가 아닌 이동을 나타낸다 */
  dashed?: boolean;
}

export interface MapData {
  markers: MapMarker[];
  lines: MapLine[];
  /** 모든 마커와 선이 보이게 맞출지. 아니면 center를 쓴다 */
  fit: boolean;
  /** 맞출 때 아래를 이만큼(px) 더 비운다. 지도 위에 바텀시트가 얹힐 때 쓴다 */
  bottomInset?: number;
  center?: [number, number];
  zoom?: number;
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

export const LONG_PRESS_MS = 600;
export const LONG_PRESS_SLOP_PX = 10;

export const DEFAULT_CENTER: [number, number] = [37.5665, 126.978];
export const DEFAULT_ZOOM = 12;

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
    var ME_ICON = L.divIcon({
      className: "",
      iconSize: [80, 80],
      iconAnchor: [40, 40],
      html: '<div class="me-wrap"><div class="me-halo"></div><div class="me-shadow"></div>' +
        '<svg class="me-ghost" viewBox="10 8 44 50" fill="none">' +
        '<path d="M12 46V28a18 18 0 0 1 36 0v16C48 47 49.5 49 52 50.5C53.5 51.5 52.5 53.5 50 53.5C47.5 53.5 46.5 51.5 44.5 51.8C42.5 52.1 42 55 39 55C36 55 35.5 52.2 33 52.4C30.5 52.6 30 55.5 26.8 55.5C23.6 55.5 23.2 52.6 20.8 52.6C18 52.6 16.5 54 14.6 53C12.6 52 12 49.5 12 46z" fill="#FFFFFF" stroke="#002968" stroke-width="3.4" stroke-linejoin="round"/>' +
        '<circle cx="24" cy="29" r="3.4" fill="#002968"/><circle cx="36" cy="29" r="3.4" fill="#002968"/>' +
        '<path d="M26.5 36.5q3.5 3 7 0" stroke="#002968" stroke-width="2.6" stroke-linecap="round"/></svg></div>'
    });
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
    window.updateMap = function (data) {
      layer.clearLayers();
      var bounds = [];
      (data.lines || []).forEach(function (line) {
        if (line.points.length < 2) return;
        L.polyline(line.points, { color: line.color, weight: line.weight || 5, opacity: line.opacity == null ? 1 : line.opacity, lineCap: "round", lineJoin: "round", dashArray: line.dashed ? "2 10" : null }).addTo(layer);
        line.points.forEach(function (p) { bounds.push(p); });
      });
      (data.markers || []).forEach(function (m) {
        if (m.kind === "pin") {
          L.marker([m.lat, m.lng], { icon: PIN_ICON, interactive: false, keyboard: false }).addTo(layer);
          bounds.push([m.lat, m.lng]);
          return;
        }
        if (m.kind === "me") {
          L.marker([m.lat, m.lng], { icon: ME_ICON, interactive: false, keyboard: false }).addTo(layer);
          bounds.push([m.lat, m.lng]);
          return;
        }
        var circle = L.circleMarker([m.lat, m.lng], { radius: m.radius || 5, color: "#FFFFFF", weight: 2, fillColor: m.color, fillOpacity: 1 }).addTo(layer);
        if (m.label) circle.bindTooltip(m.label, { permanent: true, direction: "top", offset: [0, -6], className: "label" });
        bounds.push([m.lat, m.lng]);
      });
      if (data.fit && bounds.length > 0) {
        map.fitBounds(bounds, { paddingTopLeft: [32, 32], paddingBottomRight: [32, 32 + (data.bottomInset || 0)], maxZoom: 15 });
      } else if (data.center) {
        map.setView(data.center, data.zoom || ${DEFAULT_ZOOM});
      }
    };
  }
</script>
</body>
</html>`;
}
