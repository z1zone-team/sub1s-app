import { useFonts } from "expo-font";

/** tailwind.config.js의 fontFamily 이름과 같아야 한다 */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    "Pretendard-Regular": require("../../assets/fonts/Pretendard-Regular.otf"),
    "Pretendard-Medium": require("../../assets/fonts/Pretendard-Medium.otf"),
    "Pretendard-SemiBold": require("../../assets/fonts/Pretendard-SemiBold.otf"),
    "Pretendard-Bold": require("../../assets/fonts/Pretendard-Bold.otf"),
  });
  // 글꼴을 못 불러와도 시스템 글꼴로 앱을 연다
  return loaded || error !== null;
}
