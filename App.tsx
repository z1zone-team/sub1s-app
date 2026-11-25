import "./global.css";
import "./src/common/notifications/presentation";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SplashScreen } from "./src/common/components/SplashScreen";
import { AppProviders } from "./src/providers/AppProviders";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { useAppFonts } from "./src/theme/useAppFonts";

export default function App() {
  const fontsReady = useAppFonts();
  if (!fontsReady) return <SplashScreen />;

  return (
    <AppProviders>
      <StatusBar style="auto" />
      <RootNavigator />
    </AppProviders>
  );
}
