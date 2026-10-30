export type GhostMood = "NORMAL" | "TIRED" | "DARK_CIRCLES";

const INK = "#002968";

const BODY =
  '<path d="M12 46V28a18 18 0 0 1 36 0v16C48 47 49.5 49 52 50.5C53.5 51.5 52.5 53.5 50 53.5C47.5 53.5 46.5 51.5 44.5 51.8C42.5 52.1 42 55 39 55C36 55 35.5 52.2 33 52.4C30.5 52.6 30 55.5 26.8 55.5C23.6 55.5 23.2 52.6 20.8 52.6C18 52.6 16.5 54 14.6 53C12.6 52 12 49.5 12 46z" fill="#FFFFFF" stroke="' +
  INK +
  '" stroke-width="3.4" stroke-linejoin="round"/>';

const LINE = `stroke="${INK}" stroke-width="2.6" stroke-linecap="round"`;

/** 지도 위 내 캐릭터의 viewBox="10 8 44 50" 안쪽 그림. 표정은 랭킹 화면의 표정 카드(assets/svg/ghost-mood-*.svg)와 같다 */
export const GHOST_MARKER_INNER: Record<GhostMood, string> = {
  NORMAL:
    BODY +
    `<circle cx="24" cy="29" r="3.4" fill="${INK}"/><circle cx="36" cy="29" r="3.4" fill="${INK}"/>` +
    `<path d="M26.5 36.5q3.5 3 7 0" ${LINE}/>`,
  TIRED:
    BODY +
    `<path d="M20.5 28h7M32.5 28h7" ${LINE}/>` +
    `<path d="M22.5 28.2a1.6 1.6 0 0 0 3.2 0M34.5 28.2a1.6 1.6 0 0 0 3.2 0" fill="${INK}"/>` +
    `<path d="M27 37.5h6" ${LINE}/>`,
  DARK_CIRCLES:
    BODY +
    '<path d="M19.5 31.5q5 4.5 9 0q-4 2.2-9 0zM31.5 31.5q4 4.5 9 0q-5 2.2-9 0z" fill="#B0B8C1"/>' +
    `<path d="M20.5 27h7M32.5 27h7" ${LINE}/>` +
    `<path d="M25 40q1.7-1.6 3.3 0t3.4 0t3.3 0" ${LINE} stroke-linejoin="round"/>`,
};
