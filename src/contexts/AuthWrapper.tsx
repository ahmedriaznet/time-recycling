import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AuthProvider as FirebaseAuthProvider } from "./AuthContextFirebase";
import { auth, db } from "../config/firebase";
import { ensureAdminExists } from "../utils/adminSetup";

export const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeFirebaseAuth();
  }, []);

  const initializeFirebaseAuth = async () => {
    try {
      console.log("Initializing authentication...");

      // Simple check - if Firebase services exist, we're good
      if (auth && db) {
        console.log("✅ Firebase services ready");

        // Run admin setup in background without blocking UI
        ensureAdminExists().catch((error) => {
          console.warn("⚠️ Background admin setup failed:", error);
        });

        setError(null);
      } else {
        setError("Firebase services not available");
      }
    } catch (error) {
      console.error("❌ Firebase initialization error:", error);
      setError("Failed to initialize app");
    }

    // Always stop loading after 2 seconds max
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  // Show loading screen for max 2 seconds
  if (loading) {
    return (
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="white" />
        <Text style={{ color: "white", marginTop: 16, fontSize: 16 }}>
          Loading EcoBottle...
        </Text>
        <Text
          style={{ color: "rgba(255,255,255,0.7)", marginTop: 8, fontSize: 14 }}
        >
          Starting app...
        </Text>
      </LinearGradient>
    );
  }

  // Show error screen if something went wrong
  if (error) {
    return (
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: 16,
          }}
        >
          App Error
        </Text>
        <Text
          style={{
            color: "rgba(255,255,255,0.8)",
            fontSize: 16,
            textAlign: "center",
          }}
        >
          {error}
        </Text>
        <Text
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 14,
            textAlign: "center",
            marginTop: 10,
          }}
        >
          Please restart the app
        </Text>
      </LinearGradient>
    );
  }

  // App is ready - load Firebase authentication
  return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>;
};
