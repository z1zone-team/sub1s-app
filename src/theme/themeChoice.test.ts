import { DEFAULT_THEME_CHOICE, isThemeChoice, parseThemeChoice, THEME_CHOICE_OPTIONS } from "./themeChoice";

describe("화면 테마 선택", () => {
  it("기본은 시스템이다", () => {
    expect(DEFAULT_THEME_CHOICE).toBe("system");
  });

  it("시스템, 라이트, 다크 순서로 보여 준다", () => {
    expect(THEME_CHOICE_OPTIONS.map((option) => option.label)).toEqual(["시스템", "라이트", "다크"]);
  });

  it("저장된 값이 선택인지 가려낸다", () => {
    expect(isThemeChoice("dark")).toBe(true);
    expect(isThemeChoice("neon")).toBe(false);
  });

  it("저장된 값이 없거나 알 수 없으면 시스템으로 읽는다", () => {
    expect(parseThemeChoice("dark")).toBe("dark");
    expect(parseThemeChoice(null)).toBe("system");
    expect(parseThemeChoice("neon")).toBe("system");
  });
});
