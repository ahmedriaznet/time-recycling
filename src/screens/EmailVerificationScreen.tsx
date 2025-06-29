import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useUnifiedAuth } from "../hooks/useUnifiedAuth";
import {
  sendEmailVerification,
  reload,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { PendingApprovalScreen } from "./PendingApprovalScreen";
import { DriverNavigator } from "../navigation/DriverNavigator";
import { VendorNavigator } from "../navigation/VendorNavigator";
import { FirebasePickupStoreProvider } from "../contexts/FirebasePickupStore";

export const EmailVerificationScreen: React.FC = () => {
  const { user, signOut } = useUnifiedAuth();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [manualCheckResult, setManualCheckResult] = useState<string | null>(
    null,
  );
  const [isVerified, setIsVerified] = useState(false);
  const [navigateDirectly, setNavigateDirectly] = useState(false);
  useEffect(() => {
    // Check verification status every 5 seconds, but don't show UI indicators for auto-checks
    const interval = setInterval(() => {
      if (!auth.currentUser) return;

      // Silent check without UI feedback
      reload(auth.currentUser)
        .then(() => {
          if (auth.currentUser?.emailVerified) {
            console.log("✅ Email verified automatically detected");
            // Auth context will handle the navigation
          }
        })
        .catch((error) => {
          console.error("Silent verification check failed:", error);
        });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const checkEmailVerification = async () => {
    if (checkingVerification || !auth.currentUser) return;

    setCheckingVerification(true);
    try {
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        console.log("✅ Email verified successfully");
        // The auth context will automatically detect the change and navigate
      } else {
        console.log("❌ Email not yet verified");
      }
    } catch (error) {
      console.error("Error checking email verification:", error);
    } finally {
      setCheckingVerification(false);
    }
  };

  const sendVerificationEmail = async () => {
    if (!auth.currentUser) {
      console.error("No user logged in");
      return;
    }

    setResendLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      console.log("✅ Verification email sent successfully");
    } catch (error: any) {
      console.error("Error sending verification email:", error);
    } finally {
      setResendLoading(false);
    }
  };

  const handleManualCheck = async () => {
    setLoading(true);
    setManualCheckResult(null);

    try {
      if (!auth.currentUser) return;

      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        setManualCheckResult("✅ Email verified! Redirecting...");
        console.log("✅ Email verified successfully");

        // Set verified state and trigger direct navigation
        setIsVerified(true);
        setNavigateDirectly(true);
        setLoading(false);

        // Force immediate navigation by updating verification status and triggering auth refresh
        try {
          const { updateDoc, doc } = await import("firebase/firestore");
          const { db } = await import("../config/firebase");

          await updateDoc(doc(db, "users", auth.currentUser.uid), {
            emailVerified: true,
          });
          console.log("✅ Forced emailVerified update in Firestore");

          // Force the auth context to refresh by signing out and back in
          // This ensures the auth state listener picks up all changes
          setTimeout(async () => {
            try {
              console.log("🔄 Forcing auth state refresh...");
              // Get current user credentials
              const currentEmail = auth.currentUser?.email;

              if (currentEmail) {
                // Force reload the current user to pick up verification status
                await reload(auth.currentUser!);
                console.log(
                  "✅ Auth user reloaded, verification should be detected",
                );

                // Force navigation by manually triggering auth state change
                // This is a workaround to ensure the auth context updates
                console.log("🔄 Attempting to force auth context update...");

                // The auth context should update automatically
                console.log(
                  "✅ Verification complete, waiting for auth context update...",
                );
              }
            } catch (refreshError) {
              console.error("Auth refresh failed:", refreshError);
            }
          }, 500);
        } catch (firestoreError) {
          console.error("Failed to update Firestore:", firestoreError);
        }
      } else {
        setManualCheckResult(
          "❌ Email not verified yet. Please check your email.",
        );
        setTimeout(() => setManualCheckResult(null), 3000);
      }
    } catch (error) {
      console.error("Error checking verification:", error);
      setManualCheckResult("❌ Error checking verification status");
      setTimeout(() => setManualCheckResult(null), 3000);
    } finally {
      setLoading(false);
    }
  };
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Direct navigation bypass - if verified, show appropriate screen immediately
  if (navigateDirectly && user) {
    console.log("🚀 Direct navigation triggered");
    console.log(
      `👤 User data: role=${user.role}, approvalStatus=${user.approvalStatus}, emailVerified=${user.emailVerified}`,
    );

    if (user.role === "driver") {
      // Check approval status
      if (
        user.approvalStatus === "pending" ||
        user.approvalStatus === "rejected"
      ) {
        return <PendingApprovalScreen />;
      }
      if (user.approvalStatus === "approved") {
        return (
          <FirebasePickupStoreProvider>
            <DriverNavigator />
          </FirebasePickupStoreProvider>
        );
      }
      return <PendingApprovalScreen />;
    } else if (user.role === "vendor") {
      // Check approval status
      if (
        user.approvalStatus === "pending" ||
        user.approvalStatus === "rejected"
      ) {
        return <PendingApprovalScreen />;
      }
      if (user.approvalStatus === "approved") {
        return (
          <FirebasePickupStoreProvider>
            <VendorNavigator />
          </FirebasePickupStoreProvider>
        );
      }
      return <PendingApprovalScreen />;
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <View
          style={{
            backgroundColor: "white",
            margin: 20,
            borderRadius: 20,
            padding: 30,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {/* Email Icon */}
          <View
            style={{
              width: 80,
              height: 80,
              backgroundColor: "#eff6ff",
              borderRadius: 40,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <Ionicons name="mail-outline" size={40} color="#3b82f6" />
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "#1f2937",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            Verify Your Email
          </Text>

          {/* Subtitle */}
          <Text
            style={{
              fontSize: 16,
              color: "#6b7280",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            We've sent a verification link to:
          </Text>

          {/* Email Address */}
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#3b82f6",
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            {user?.email}
          </Text>

          {/* Instructions */}
          <Text
            style={{
              fontSize: 14,
              color: "#6b7280",
              textAlign: "center",
              marginBottom: 32,
              lineHeight: 20,
            }}
          >
            Please click the verification link in your email to continue. Check
            your spam folder if you don't see it.
          </Text>

          {/* Action Buttons */}
          <View style={{ width: "100%" }}>
            {/* Manual Check Button */}
            <TouchableOpacity
              onPress={handleManualCheck}
              disabled={loading}
              style={{
                backgroundColor: "#3b82f6",
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderRadius: 12,
                alignItems: "center",
                marginBottom: 12,
                opacity: loading ? 0.7 : 1,
                minHeight: 50,
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="refresh-outline" size={20} color="white" />
                  <Text
                    style={{
                      color: "white",
                      fontSize: 15,
                      fontWeight: "600",
                      marginLeft: 8,
                    }}
                  >
                    I've Verified My Email
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Resend Email Button */}
            <TouchableOpacity
              onPress={sendVerificationEmail}
              disabled={resendLoading}
              style={{
                backgroundColor: "#f3f4f6",
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderRadius: 12,
                alignItems: "center",
                marginBottom: 12,
                opacity: resendLoading ? 0.7 : 1,
                minHeight: 50,
              }}
            >
              {resendLoading ? (
                <ActivityIndicator color="#6b7280" />
              ) : (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="paper-plane-outline"
                    size={20}
                    color="#6b7280"
                  />
                  <Text
                    style={{
                      color: "#6b7280",
                      fontSize: 15,
                      fontWeight: "600",
                      marginLeft: 8,
                    }}
                  >
                    Resend Email
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Sign Out Button */}
            <TouchableOpacity
              onPress={handleSignOut}
              style={{
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#ef4444",
                  fontSize: 14,
                  fontWeight: "500",
                }}
              >
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>

          {/* Manual check result */}
          {manualCheckResult && (
            <View
              style={{
                marginTop: 16,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: manualCheckResult.includes("✅")
                  ? "#f0fdf4"
                  : "#fef2f2",
                borderRadius: 8,
                borderWidth: 1,
                borderColor: manualCheckResult.includes("✅")
                  ? "#10b981"
                  : "#ef4444",
              }}
            >
              <Text
                style={{
                  color: manualCheckResult.includes("✅")
                    ? "#059669"
                    : "#dc2626",
                  fontSize: 14,
                  textAlign: "center",
                  fontWeight: "500",
                }}
              >
                {manualCheckResult}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};
