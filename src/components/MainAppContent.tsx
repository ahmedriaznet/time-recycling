import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useUnifiedAuth } from "../hooks/useUnifiedAuth";
import { OnboardingFlow } from "../screens/OnboardingFlow";
import { DriverNavigator } from "../navigation/DriverNavigator";
import { VendorNavigator } from "../navigation/VendorNavigator";
import { AdminNavigator } from "../navigation/AdminNavigator";
import { PendingApprovalScreen } from "../screens/PendingApprovalScreen";
import { EmailVerificationScreen } from "../screens/EmailVerificationScreen";
import { FirebasePickupStoreProvider } from "../contexts/FirebasePickupStore";
import { auth } from "../config/firebase";

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
    console.log(
      `🔍 MainAppContent - User role: ${user.role}, emailVerified: ${user.emailVerified}, approvalStatus: ${user.approvalStatus}`,
    );

    // Show appropriate navigator based on user role with Firebase pickup store
    if (user.role === "driver") {
      // First check if email is verified - required for all steps
      if (!user.emailVerified) {
        console.log("📧 Showing EmailVerificationScreen - email not verified");
        return <EmailVerificationScreen />;
      }

      // Check driver approval status (only after email is verified)
      if (
        user.approvalStatus === "pending" ||
        user.approvalStatus === "rejected"
      ) {
        return <PendingApprovalScreen />;
      }

      // Show driver app if approved and email verified
      if (user.approvalStatus === "approved") {
        return (
          <FirebasePickupStoreProvider>
            <DriverNavigator />
          </FirebasePickupStoreProvider>
        );
      }

      // Default to pending for drivers without approval status set
      return <PendingApprovalScreen />;
    } else if (user.role === "vendor") {
      // Check if email is verified for vendors
      if (!user.emailVerified) {
        console.log(
          "📧 Showing EmailVerificationScreen for vendor - email not verified",
        );
        return <EmailVerificationScreen />;
      }

      // Check vendor approval status (only after email is verified)
      if (
        user.approvalStatus === "pending" ||
        user.approvalStatus === "rejected"
      ) {
        return <PendingApprovalScreen />;
      }

      // Show vendor app if approved and email verified
      if (user.approvalStatus === "approved") {
        return (
          <FirebasePickupStoreProvider>
            <VendorNavigator />
          </FirebasePickupStoreProvider>
        );
      }

      // Default to pending for vendors without approval status set
      return <PendingApprovalScreen />;
    } else if (user.role === "admin") {
      // Admins login through vendor path but get routed to admin interface
      return <AdminNavigator />;
    }
  }

  // Only show onboarding when we're certain user is not authenticated
  // (loading is false and user is null)
  return <OnboardingFlow />;
};
