import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AuthProvider as FirebaseAuthProvider } from "./AuthContextFirebase";
import { testFirebaseConnection } from "../config/firebase";

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
      console.log("🔥 Initializing Firebase authentication...");

      // Test Firebase connection
      const isFirebaseWorking = await testFirebaseConnection();

      if (isFirebaseWorking) {
        console.log("✅ Firebase is ready");
        setError(null);
      } else {
        throw new Error("Firebase connection failed");
      }
    } catch (error) {
      console.error("❌ Firebase initialization error:", error);
      setError(
        "Firebase connection failed. Please check your internet connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Show loading screen while initializing Firebase
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
          Loading Time Recycling Service...
        </Text>
        <Text
          style={{ color: "rgba(255,255,255,0.7)", marginTop: 8, fontSize: 14 }}
        >
          Connecting to Firebase...
        </Text>
      </LinearGradient>
    );
  }

  // Show error screen if Firebase fails
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
          Connection Error
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
      </LinearGradient>
    );
  }

  // Use Firebase authentication
  return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>;
};
