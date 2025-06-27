import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { AuthWrapper } from "./src/contexts/AuthWrapper";
import { ThemeProvider } from "./src/contexts/ThemeContext";
import { NotificationProvider } from "./src/contexts/NotificationContext";
import { MainAppContent } from "./src/components/MainAppContent";
import { NotificationSystem } from "./src/components/NotificationSystem";

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <NavigationContainer>
        <ThemeProvider>
          <NotificationProvider>
            <AuthWrapper>
              <MainAppContent />
              <NotificationSystem />
            </AuthWrapper>
          </NotificationProvider>
        </ThemeProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
