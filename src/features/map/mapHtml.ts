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
}

export interface MapLine {
  color: string;
  points: Array<[number, number]>;
  weight?: number;
  opacity?: number;
}

export interface MapData {
  markers: MapMarker[];
  lines: MapLine[];
  /** 모든 마커와 선이 보이게 맞출지. 아니면 center를 쓴다 */
  fit: boolean;
  center?: [number, number];
  zoom?: number;
}

export const DEFAULT_CENTER: [number, number] = [37.5665, 126.978];
export const DEFAULT_ZOOM = 12;

/**
 * V-World 타일(WMTS)을 Leaflet으로 그리는 페이지. 앱이 window.updateMap(데이터)을 불러 마커와 선을 바꾼다.
 * 키는 주소에 들어가므로 URL 인코딩한다.
 */
export function buildMapHtml(vworldKey: string): string {
  const key = encodeURIComponent(vworldKey);
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="${LEAFLET_CSS}" />
<style>
  html, body, #map { margin: 0; height: 100%; width: 100%; }
  .label { background: rgba(255,255,255,0.9); border: 0; border-radius: 8px; padding: 1px 6px; font: 600 11px sans-serif; color: #111827; box-shadow: none; }
  #error { display: none; padding: 16px; font: 14px sans-serif; color: #4B5563; }
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
    L.tileLayer("https://api.vworld.kr/req/wmts/1.0.0/${key}/Base/{z}/{y}/{x}.png", {
      maxZoom: 19
    }).addTo(map);
    var layer = L.layerGroup().addTo(map);
    window.updateMap = function (data) {
      layer.clearLayers();
      var bounds = [];
      (data.lines || []).forEach(function (line) {
        if (line.points.length < 2) return;
        L.polyline(line.points, { color: line.color, weight: line.weight || 5, opacity: line.opacity == null ? 1 : line.opacity, lineCap: "round", lineJoin: "round" }).addTo(layer);
        line.points.forEach(function (p) { bounds.push(p); });
      });
      (data.markers || []).forEach(function (m) {
        var circle = L.circleMarker([m.lat, m.lng], { radius: m.radius || 5, color: "#FFFFFF", weight: 2, fillColor: m.color, fillOpacity: 1 }).addTo(layer);
        if (m.label) circle.bindTooltip(m.label, { permanent: true, direction: "top", offset: [0, -6], className: "label" });
        bounds.push([m.lat, m.lng]);
      });
      if (data.fit && bounds.length > 0) {
        map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
      } else if (data.center) {
        map.setView(data.center, data.zoom || ${DEFAULT_ZOOM});
      }
    };
  }
</script>
</body>
</html>`;
}
