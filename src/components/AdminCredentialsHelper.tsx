import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAdminCredentials } from "../utils/adminSetup";

// This component shows admin credentials for testing purposes
// Remove or disable in production
export const AdminCredentialsHelper: React.FC = () => {
  const [showCredentials, setShowCredentials] = useState(false);
  const adminCreds = getAdminCredentials();

  // Only show in development mode
  if (__DEV__ === false) {
    return null;
  }

  return (
    <>
      {/* Small helper button */}
      <TouchableOpacity
        onPress={() => setShowCredentials(true)}
        style={{
          position: "absolute",
          top: 50,
          right: 20,
          width: 40,
          height: 40,
          backgroundColor: "rgba(0,0,0,0.3)",
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
      >
        <Ionicons name="information-circle" size={20} color="white" />
      </TouchableOpacity>

      {/* Credentials Modal */}
      <Modal visible={showCredentials} animationType="fade" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 24,
              width: "100%",
              maxWidth: 350,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Ionicons name="shield-checkmark" size={24} color="#6366f1" />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "#1f2937",
                  marginLeft: 8,
                }}
              >
                Admin Login Info
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "#f3f4f6",
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
                How to login as admin:
              </Text>
              <Text style={{ fontSize: 14, color: "#374151", marginBottom: 8 }}>
                1. Select "I'm a Vendor"
              </Text>
              <Text style={{ fontSize: 14, color: "#374151", marginBottom: 8 }}>
                2. Use these credentials:
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "#eff6ff",
                borderRadius: 8,
                padding: 16,
                marginBottom: 20,
              }}
            >
              <View style={{ marginBottom: 12 }}>
                <Text
                  style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}
                >
                  EMAIL:
                </Text>
                <Text
                  style={{ fontSize: 16, color: "#1f2937", fontWeight: "500" }}
                  selectable
                >
                  {adminCreds.email}
                </Text>
              </View>

              <View>
                <Text
                  style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}
                >
                  PASSWORD:
                </Text>
                <Text
                  style={{ fontSize: 16, color: "#1f2937", fontWeight: "500" }}
                  selectable
                >
                  {adminCreds.password}
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: "#fef3c7",
                borderRadius: 8,
                padding: 12,
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 12, color: "#92400e" }}>
                💡 Forgot password feature works for admin account too!
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowCredentials(false)}
              style={{
                backgroundColor: "#6366f1",
                borderRadius: 8,
                padding: 16,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>
                Got it!
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};
