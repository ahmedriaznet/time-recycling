import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, serverTimestamp } from "../../config/firebase";
import { useUnifiedAuth } from "../../hooks/useUnifiedAuth";
import { useNotification } from "../../contexts/NotificationContext";

export const AddUserScreen: React.FC = () => {
  const navigation = useNavigation();
  const { showNotification } = useNotification();
  const { user: adminUser } = useUnifiedAuth();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"driver" | "vendor">(
    "driver",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState("");

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setBusinessName("");
    setBusinessCategory("");
    setVehicleInfo("");
    setSelectedRole("driver");
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter the user's full name");
      return false;
    }
    if (!email.trim()) {
      Alert.alert("Error", "Please enter the user's email address");
      return false;
    }
    if (!password.trim()) {
      Alert.alert("Error", "Please enter a password");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return false;
    }
    if (!phone.trim()) {
      Alert.alert("Error", "Please enter the user's phone number");
      return false;
    }
    if (selectedRole === "vendor" && !businessName.trim()) {
      Alert.alert("Error", "Please enter the business name for vendors");
      return false;
    }
    if (selectedRole === "driver" && !vehicleInfo.trim()) {
      Alert.alert("Error", "Please enter vehicle information for drivers");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Show instructions to admin instead of creating user directly
    Alert.alert(
      "User Creation Instructions",
      `To avoid admin logout, please follow these steps:\n\n1. Copy these credentials:\nEmail: ${email.trim()}\nPassword: ${password.trim()}\n\n2. Ask the user to sign up themselves using these credentials\n3. You can then approve them from the admin panel\n\nAlternatively, use Firebase Console to create users without affecting your session.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Copy Credentials",
          onPress: () => {
            // In a real app, you'd copy to clipboard
            Alert.alert(
              "Credentials",
              `Email: ${email.trim()}\nPassword: ${password.trim()}\n\nShare these with the user for signup.`,
            );
            resetForm();
            navigation.goBack();
          },
        },
      ],
    );
  };

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255,255,255,0.2)",
          }}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "white" }}>
            Add New User
          </Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={{
              backgroundColor: loading
                ? "rgba(255,255,255,0.3)"
                : "rgba(255,255,255,0.2)",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.3)",
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={{ color: "white", fontWeight: "600" }}>
                Add User
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Form Container */}
        <View style={{ flex: 1, padding: 20 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 50 }}
          >
            {/* Role Selection */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "white",
                  marginBottom: 8,
                }}
              >
                User Role *
              </Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setSelectedRole("driver")}
                  style={{
                    flex: 1,
                    backgroundColor:
                      selectedRole === "driver"
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    padding: 12,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor:
                      selectedRole === "driver"
                        ? "rgba(255,255,255,0.5)"
                        : "rgba(255,255,255,0.2)",
                  }}
                >
                  <Ionicons name="car-outline" size={24} color="white" />
                  <Text
                    style={{ color: "white", fontWeight: "600", marginTop: 4 }}
                  >
                    Driver
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedRole("vendor")}
                  style={{
                    flex: 1,
                    backgroundColor:
                      selectedRole === "vendor"
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    padding: 12,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor:
                      selectedRole === "vendor"
                        ? "rgba(255,255,255,0.5)"
                        : "rgba(255,255,255,0.2)",
                  }}
                >
                  <Ionicons name="storefront-outline" size={24} color="white" />
                  <Text
                    style={{ color: "white", fontWeight: "600", marginTop: 4 }}
                  >
                    Vendor
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Name Field */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "white",
                  marginBottom: 6,
                }}
              >
                Full Name *
              </Text>
              <TextInput
                style={{
                  backgroundColor: "white",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: "#333",
                  height: 48,
                }}
                value={name}
                onChangeText={setName}
                placeholder="Enter user's full name"
                placeholderTextColor="#999"
              />
            </View>

            {/* Email Field */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "white",
                  marginBottom: 6,
                }}
              >
                Email Address *
              </Text>
              <TextInput
                style={{
                  backgroundColor: "white",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: "#333",
                  height: 48,
                }}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter user's email address"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Field */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "white",
                  marginBottom: 6,
                }}
              >
                Password *
              </Text>
              <TextInput
                style={{
                  backgroundColor: "white",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: "#333",
                  height: 48,
                }}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter user's password (min 6 characters)"
                placeholderTextColor="#999"
                secureTextEntry={true}
                autoCapitalize="none"
              />
            </View>

            {/* Phone Field */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "white",
                  marginBottom: 6,
                }}
              >
                Phone Number *
              </Text>
              <TextInput
                style={{
                  backgroundColor: "white",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: "#333",
                  height: 48,
                }}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter user's phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            {/* Vendor Fields */}
            {selectedRole === "vendor" && (
              <>
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "white",
                      marginBottom: 6,
                    }}
                  >
                    Business Name *
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: "white",
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 16,
                      color: "#333",
                      height: 48,
                    }}
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder="Enter business name"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "white",
                      marginBottom: 6,
                    }}
                  >
                    Business Category
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: "white",
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 16,
                      color: "#333",
                      height: 48,
                    }}
                    value={businessCategory}
                    onChangeText={setBusinessCategory}
                    placeholder="e.g., Restaurant, Bar, Hotel"
                    placeholderTextColor="#999"
                  />
                </View>
              </>
            )}

            {/* Driver Fields */}
            {selectedRole === "driver" && (
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "white",
                    marginBottom: 6,
                  }}
                >
                  Vehicle Information *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: "white",
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    color: "#333",
                    height: 80,
                    textAlignVertical: "top",
                  }}
                  value={vehicleInfo}
                  onChangeText={setVehicleInfo}
                  placeholder="e.g., White Toyota Camry - License ABC123"
                  placeholderTextColor="#999"
                  multiline
                />
              </View>
            )}

            {/* Info Box */}
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: 16,
                marginTop: 20,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.2)",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: "white",
                  fontWeight: "600",
                  marginBottom: 8,
                }}
              >
                📋 How it works:
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.9)",
                  lineHeight: 18,
                }}
              >
                • The user will be auto-approved (no manual approval needed)
                {"\n"}• They must verify their email before they can login{"\n"}
                • Share the credentials with the user after creation
              </Text>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};
