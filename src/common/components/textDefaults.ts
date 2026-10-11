const HAS_FONT = /(^|\s)font-sans(-|\s|$)/;
const HAS_COLOR =
  /(^|\s)text-(text|primary|on-primary|accent|success|warning|error|info|bg|surface|border|subway|congestion)(-|\s|$)/;

export const DEFAULT_FONT = "font-sans";
export const DEFAULT_COLOR = "text-text";

/** 글꼴과 글자색을 지정하지 않은 텍스트에 기본값을 붙인다. 같은 종류의 클래스가 겹치면 어느 쪽이 이길지 알 수 없어서 있을 때는 붙이지 않는다 */
export function withTextDefaults(className: string | undefined): string {
  const base = className ?? "";
  const parts = [base];
  if (!HAS_FONT.test(base)) parts.push(DEFAULT_FONT);
  if (!HAS_COLOR.test(base)) parts.push(DEFAULT_COLOR);
  return parts.filter(Boolean).join(" ");
}
