/** 설정에서 고르는 화면 테마. system은 기기 설정을 따른다 */
export type ThemeChoice = "system" | "light" | "dark";

export const DEFAULT_THEME_CHOICE: ThemeChoice = "system";

export const THEME_CHOICE_OPTIONS: ReadonlyArray<{ value: ThemeChoice; label: string; description: string }> = [
  { value: "system", label: "시스템", description: "기기 설정을 따라요" },
  { value: "light", label: "라이트", description: "밝은 화면" },
  { value: "dark", label: "다크", description: "어두운 화면" },
];

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === "system" || value === "light" || value === "dark";
}

/** 저장된 문자열을 선택으로 바꾼다. 없거나 알 수 없는 값이면 시스템 */
export function parseThemeChoice(value: string | null | undefined): ThemeChoice {
  return isThemeChoice(value) ? value : DEFAULT_THEME_CHOICE;
}
