import type { Palette } from "./palette";

const kebab = (name: string): string => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/** 팔레트의 camelCase 키를 tailwind.config.js의 색 변수 이름(--color-primary-tint)으로 바꾼다 */
export function paletteToCssVars(palette: Palette): Record<string, string> {
  return Object.fromEntries(Object.entries(palette).map(([key, value]) => [`--color-${kebab(key)}`, value]));
}
