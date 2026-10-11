import { paletteToCssVars } from "./cssVars";
import { palettes } from "./palette";

const config = require("../../tailwind.config.js") as {
  theme: { extend: { colors: Record<string, unknown> } };
};

function collectVarNames(value: unknown, found: Set<string>): void {
  if (typeof value === "string") {
    const match = /^var\((--color-[a-z-]+)\)$/.exec(value);
    if (match) found.add(match[1]);
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((child) => collectVarNames(child, found));
  }
}

describe("디자인 토큰", () => {
  const used = new Set<string>();
  collectVarNames(config.theme.extend.colors, used);

  it("라이트와 다크 팔레트가 같은 변수를 가진다", () => {
    expect(Object.keys(paletteToCssVars(palettes.dark)).sort()).toEqual(
      Object.keys(paletteToCssVars(palettes.light)).sort()
    );
  });

  it("tailwind가 쓰는 색 변수는 모두 팔레트에 있다", () => {
    const defined = new Set(Object.keys(paletteToCssVars(palettes.light)));
    const missing = [...used].filter((name) => !defined.has(name));
    expect(missing).toEqual([]);
  });

  it("팔레트의 모든 색에 tailwind 이름이 있다", () => {
    const unused = Object.keys(paletteToCssVars(palettes.light)).filter((name) => !used.has(name));
    expect(unused).toEqual([]);
  });

  it("camelCase 키를 변수 이름으로 바꾼다", () => {
    const vars = paletteToCssVars(palettes.light);
    expect(vars["--color-primary-tint"]).toBe("#E8EDF6");
    expect(vars["--color-text-secondary"]).toBe("#4B5563");
  });
});
