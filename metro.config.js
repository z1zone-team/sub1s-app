const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// 네이티브에서 rem 기본값은 14px라서 px-5(20px 기대)가 17.5px로 그려진다. 디자인의 4px 눈금과 맞도록 16으로 둔다
module.exports = withNativeWind(config, { input: "./global.css", inlineRem: 16 });
