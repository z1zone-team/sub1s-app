export interface LineInfo {
  id: string;
  /** 노선도, 목록에 쓰는 전체 이름 */
  name: string;
  /** 배지 안에 들어가는 짧은 글자 */
  shortLabel: string;
  color: string;
}

/**
 * 서버 호선 ID(`stations.json`의 lineId)와 같은 키를 쓴다.
 * 색은 프로토타입 토큰이 있으면 그 값을, 없으면 서버 `lines.json` 값을 따른다
 */
export const LINES: Readonly<Record<string, LineInfo>> = {
  "01": { id: "01", name: "1호선", shortLabel: "1", color: "#0052A4" },
  "02": { id: "02", name: "2호선", shortLabel: "2", color: "#00A84D" },
  "03": { id: "03", name: "3호선", shortLabel: "3", color: "#EF7C1C" },
  "04": { id: "04", name: "4호선", shortLabel: "4", color: "#00A5DE" },
  "05": { id: "05", name: "5호선", shortLabel: "5", color: "#996CAC" },
  "06": { id: "06", name: "6호선", shortLabel: "6", color: "#CD7C2F" },
  "07": { id: "07", name: "7호선", shortLabel: "7", color: "#747F00" },
  "08": { id: "08", name: "8호선", shortLabel: "8", color: "#E6186C" },
  "09": { id: "09", name: "9호선", shortLabel: "9", color: "#BDB092" },
  AR: { id: "AR", name: "공항철도", shortLabel: "공항", color: "#0090D2" },
  EV: { id: "EV", name: "에버라인", shortLabel: "에버", color: "#56AD2D" },
  GA: { id: "GA", name: "GTX-A", shortLabel: "GTX-A", color: "#9A6292" },
  GC: { id: "GC", name: "경춘선", shortLabel: "경춘", color: "#0C8E72" },
  GG: { id: "GG", name: "경강선", shortLabel: "경강", color: "#0054A6" },
  GJ: { id: "GJ", name: "경의중앙선", shortLabel: "경의중앙", color: "#77C4A3" },
  GM: { id: "GM", name: "김포골드라인", shortLabel: "김포", color: "#A17800" },
  I1: { id: "I1", name: "인천1호선", shortLabel: "인천1", color: "#8CADCB" },
  I2: { id: "I2", name: "인천2호선", shortLabel: "인천2", color: "#F06A00" },
  SB: { id: "SB", name: "신분당선", shortLabel: "신분당", color: "#D4003B" },
  SD: { id: "SD", name: "수인분당선", shortLabel: "수인분당", color: "#FABE00" },
  SH: { id: "SH", name: "서해선", shortLabel: "서해", color: "#8FC31F" },
  SL: { id: "SL", name: "신림선", shortLabel: "신림", color: "#6789CA" },
  UI: { id: "UI", name: "우이신설선", shortLabel: "우이신설", color: "#B7C450" },
  UJ: { id: "UJ", name: "의정부경전철", shortLabel: "의정부", color: "#FD8100" },
};

export const WALK_LINE_ID = "WALK";

const UNKNOWN_LINE_COLOR = "#B0B8C1";

export function getLineInfo(lineId: string): LineInfo {
  return (
    LINES[lineId] ?? {
      id: lineId,
      name: lineId,
      shortLabel: lineId,
      color: UNKNOWN_LINE_COLOR,
    }
  );
}

function relativeLuminance(hex: string): number {
  const value = hex.replace("#", "");
  const channel = (start: number): number => {
    const srgb = parseInt(value.slice(start, start + 2), 16) / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

/** 배지 배경색 위에서 읽을 수 있는 글자색. 밝은 노선색(9호선, 수인분당선 등)은 어두운 글자를 쓴다 */
export function lineTextColor(background: string): string {
  return relativeLuminance(background) > 0.35 ? "#191F28" : "#FFFFFF";
}
