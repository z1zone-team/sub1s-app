import { palettes, type Palette } from "./palette";

declare const __dirname: string;
const fs = require("fs") as { readFileSync(file: string, encoding: string): string };
const path = require("path") as { join(...parts: string[]): string };

const config = require("../../tailwind.config.js") as {
  theme: { extend: { colors: Record<string, unknown> } };
};

const css = fs.readFileSync(path.join(__dirname, "../../global.css"), "utf8");

const kebab = (name: string): string => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

function readBlock(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`global.css에 ${selector}가 없다`);
  const body = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries(
    [...body.matchAll(/--color-([a-z-]+):\s*(#[0-9a-fA-F]+);/g)].map((match) => [match[1], match[2].toLowerCase()])
  );
}

function expectedVars(palette: Palette): Record<string, string> {
  return Object.fromEntries(Object.entries(palette).map(([key, value]) => [kebab(key), value.toLowerCase()]));
}

function collectVarNames(value: unknown, found: Set<string>): void {
  if (typeof value === "string") {
    const match = /^var\(--color-([a-z-]+)\)$/.exec(value);
    if (match) found.add(match[1]);
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((child) => collectVarNames(child, found));
  }
}

describe("디자인 토큰", () => {
  const light = readBlock(":root");
  const darkOverrides = readBlock(".dark:root");

  it("global.css의 라이트 색이 palette.ts와 같다", () => {
    expect(light).toEqual(expectedVars(palettes.light));
  });

  it("global.css의 다크 색이 palette.ts와 같다", () => {
    expect({ ...light, ...darkOverrides }).toEqual(expectedVars(palettes.dark));
  });

  it("다크에서는 바뀌는 색만 다시 적는다", () => {
    const unchanged = Object.keys(darkOverrides).filter((name) => darkOverrides[name] === light[name]);
    expect(unchanged).toEqual([]);
  });

  it("tailwind가 쓰는 색 변수는 모두 global.css에 있고 빠진 색도 없다", () => {
    const used = new Set<string>();
    collectVarNames(config.theme.extend.colors, used);
    expect([...used].sort()).toEqual(Object.keys(light).sort());
  });
});
