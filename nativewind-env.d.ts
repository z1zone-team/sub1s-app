/// <reference types="nativewind/types" />

declare module "*.css";

/** `.svg` 파일은 react-native-svg-transformer가 컴포넌트로 바꿔 준다 */
declare module "*.svg" {
  import type React from "react";
  import type { SvgProps } from "react-native-svg";
  const content: React.FC<SvgProps>;
  export default content;
}
