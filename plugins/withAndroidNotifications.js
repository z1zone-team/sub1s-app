const { withPlugins } = require("expo/config-plugins");

/** 공식 알림 플러그인의 Android 설정을 적용하고 기존 iOS mod는 보존한다. */
module.exports = function withAndroidNotifications(config, options) {
  const iosMods = config.mods?.ios ? { ...config.mods.ios } : undefined;
  const result = withPlugins(config, [["expo-notifications", options]]);
  if (result.mods) {
    if (iosMods) result.mods.ios = iosMods;
    else delete result.mods.ios;
  }
  return result;
};
