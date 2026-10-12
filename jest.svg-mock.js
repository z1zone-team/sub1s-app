/** 테스트에서는 `.svg` 파일을 빈 컴포넌트로 대신한다 (react-native-svg-transformer는 앱 번들에서만 동작) */
const React = require("react");

module.exports = function SvgMock(props) {
  return React.createElement("svg", props);
};
module.exports.default = module.exports;
