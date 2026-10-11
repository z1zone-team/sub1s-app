import { withTextDefaults } from "./textDefaults";

describe("withTextDefaults", () => {
  it("아무것도 지정하지 않으면 기본 글꼴과 글자색을 붙인다", () => {
    expect(withTextDefaults("text-body")).toBe("text-body font-sans text-text");
    expect(withTextDefaults(undefined)).toBe("font-sans text-text");
  });

  it("글꼴을 지정했으면 글꼴은 붙이지 않는다", () => {
    expect(withTextDefaults("font-sans-bold text-body")).toBe("font-sans-bold text-body text-text");
  });

  it("글자색을 지정했으면 글자색은 붙이지 않는다", () => {
    expect(withTextDefaults("text-body text-text-secondary")).toBe("text-body text-text-secondary font-sans");
    expect(withTextDefaults("text-small text-primary")).toBe("text-small text-primary font-sans");
    expect(withTextDefaults("text-on-primary")).toBe("text-on-primary font-sans");
  });

  it("둘 다 지정했으면 그대로다", () => {
    expect(withTextDefaults("font-sans-medium text-error")).toBe("font-sans-medium text-error");
  });

  it("글자 크기 클래스를 글자색으로 착각하지 않는다", () => {
    expect(withTextDefaults("text-title")).toContain("text-text");
    expect(withTextDefaults("text-small")).toContain("text-text");
  });
});
