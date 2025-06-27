import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useUnifiedAuth } from "../hooks/useUnifiedAuth";
import { OnboardingFlow } from "../screens/OnboardingFlow";
import { DriverNavigator } from "../navigation/DriverNavigator";
import { VendorNavigator } from "../navigation/VendorNavigator";
import { FirebasePickupStoreProvider } from "../contexts/FirebasePickupStore";

export const MainAppContent: React.FC = () => {
  const { user, loading } = useUnifiedAuth();

  // Show loading indicator while checking auth state
  // This prevents showing OnboardingFlow while auth state is being determined
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#667eea",
        }}
      >
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  // If user is authenticated, show appropriate navigator immediately
  if (user) {
    // Show appropriate navigator based on user role with Firebase pickup store
    if (user.role === "driver") {
      return (
        <FirebasePickupStoreProvider>
          <DriverNavigator />
        </FirebasePickupStoreProvider>
      );
    } else if (user.role === "vendor") {
      return (
        <FirebasePickupStoreProvider>
          <VendorNavigator />
        </FirebasePickupStoreProvider>
      );
    }
  }

  // Only show onboarding when we're certain user is not authenticated
  // (loading is false and user is null)
  return <OnboardingFlow />;
};
