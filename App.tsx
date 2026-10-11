import "./global.css";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { AppProviders } from "./src/providers/AppProviders";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { ThemeVars } from "./src/theme/ThemeVars";
import { useAppFonts } from "./src/theme/useAppFonts";

export default function App() {
  const fontsReady = useAppFonts();
  if (!fontsReady) return null;

  return (
    <AppProviders>
      <ThemeVars>
        <StatusBar style="auto" />
        <RootNavigator />
      </ThemeVars>
    </AppProviders>
  );
}
