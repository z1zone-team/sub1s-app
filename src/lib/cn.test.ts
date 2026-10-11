import { cn, FONT_FAMILY_TOKENS, FONT_SIZE_TOKENS, RADIUS_TOKENS } from "./cn";

const config = require("../../tailwind.config.js") as {
  theme: { extend: { fontSize: Record<string, string>; fontFamily: Record<string, string[]>; borderRadius: Record<string, string> } };
};

describe("cn", () => {
  it("조건부 클래스를 합친다", () => {
    expect(cn("a", false && "b", undefined, { c: true, d: false }, ["e"])).toBe("a c e");
  });

  it("같은 종류의 클래스는 뒤의 것이 남는다", () => {
    expect(cn("text-text", "text-primary")).toBe("text-primary");
    expect(cn("font-sans", "font-sans-bold")).toBe("font-sans-bold");
    expect(cn("rounded-md", "rounded-xs-plus")).toBe("rounded-xs-plus");
  });

  it("글자 크기와 글자색은 서로 지우지 않는다", () => {
    expect(cn("text-body", "text-text-secondary")).toBe("text-body text-text-secondary");
    expect(cn("text-body-sm", "text-primary", "text-display-md")).toBe("text-primary text-display-md");
  });

  it("글꼴과 글자 크기, 글자색은 서로 지우지 않는다", () => {
    expect(cn("font-sans-bold", "text-title", "text-error")).toBe("font-sans-bold text-title text-error");
  });
});

describe("cn 설정과 tailwind.config.js", () => {
  const extend = config.theme.extend;

  it("글자 크기 토큰 이름이 같다", () => {
    expect([...FONT_SIZE_TOKENS].sort()).toEqual(Object.keys(extend.fontSize).filter((name) => name !== "base").sort());
  });

  it("글꼴 토큰 이름이 같다", () => {
    expect(Object.keys(extend.fontFamily).filter((name) => name !== "sans").sort()).toEqual([...FONT_FAMILY_TOKENS].sort());
  });

  it("병합 설정의 둥글기 토큰은 모두 설정에 있다", () => {
    expect(RADIUS_TOKENS.filter((name) => !(name in extend.borderRadius))).toEqual([]);
  });
});
