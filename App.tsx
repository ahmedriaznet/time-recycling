import React, { useEffect } from "react";
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
import { FCMPushNotificationService } from "./src/utils/fcmPushNotificationService";

export default function App() {
  useEffect(() => {
    // Set up FCM background handler
    FCMPushNotificationService.setupBackgroundHandler();

    // Set up FCM foreground listener
    const unsubscribeFCM = FCMPushNotificationService.setupForegroundListener();

    // Cleanup on unmount
    return () => {
      unsubscribeFCM();
    };
  }, []);

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
