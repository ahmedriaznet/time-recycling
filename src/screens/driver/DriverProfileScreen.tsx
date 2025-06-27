import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useUnifiedAuth } from "../../hooks/useUnifiedAuth";
import { useFirebasePickupStore } from "../../contexts/FirebasePickupStore";
import { BiometricAuth } from "../../utils/BiometricAuth";
import { reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "../../config/firebase";

export const DriverProfileScreen: React.FC = () => {
  const { user, signOut } = useUnifiedAuth();
  const { getPickupsForDriver } = useFirebasePickupStore();
  const [isAvailable, setIsAvailable] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  React.useEffect(() => {
    const checkBiometric = async () => {
      const available = await BiometricAuth.isAvailable();
      const enabled = await BiometricAuth.isBiometricEnabled();
      setBiometricAvailable(available);
      setBiometricEnabled(enabled);
    };
    checkBiometric();
  }, []);

  // Get driver stats
  const allPickups = getPickupsForDriver(user?.uid || "");
  const completedPickups = allPickups.filter((p) => p.status === "completed");
  const totalBottles = completedPickups.reduce(
    (sum, p) => sum + p.bottleCount,
    0,
  );
  const estimatedEarnings = completedPickups.length * 15; // $15 per pickup estimate

  const handleBiometricToggle = async (enabled: boolean) => {
    if (enabled) {
      const supportedTypes = await BiometricAuth.getSupportedTypes();
      const authType = supportedTypes[0] || "Biometric";

      Alert.alert(
        `Enable ${authType} Login?`,
        `Use ${authType} to sign in quickly and securely. You'll need to enter your current password to verify your identity.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Set Up",
            onPress: async () => {
              Alert.prompt(
                "Verify Password",
                "Please enter your current password to enable biometric login",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Verify & Enable",
                    onPress: async (password) => {
                      if (!password || !user?.email) {
                        Alert.alert("Error", "Password is required.");
                        return;
                      }

                      try {
                        // Verify password by re-authenticating with Firebase
                        const currentUser = auth.currentUser;
                        if (!currentUser) {
                          Alert.alert("Error", "User not authenticated.");
                          return;
                        }

                        const credential = EmailAuthProvider.credential(
                          user.email,
                          password,
                        );

                        // This will throw an error if password is wrong
                        await reauthenticateWithCredential(
                          currentUser,
                          credential,
                        );

                        // Password is correct, now save credentials for biometric login
                        const success = await BiometricAuth.saveCredentials({
                          email: user.email,
                          password: password,
                        });

                        if (success) {
                          setBiometricEnabled(true);
                          Alert.alert(
                            "Success!",
                            `${authType} login has been enabled successfully.`,
                          );
                        } else {
                          Alert.alert(
                            "Error",
                            "Failed to enable biometric login. Please try again.",
                          );
                        }
                      } catch (error: any) {
                        console.error("Password verification failed:", error);
                        if (
                          error.code === "auth/wrong-password" ||
                          error.code === "auth/invalid-credential"
                        ) {
                          Alert.alert(
                            "Incorrect Password",
                            "The password you entered is incorrect. Please try again.",
                          );
                        } else {
                          Alert.alert(
                            "Error",
                            "Failed to verify password. Please try again.",
                          );
                        }
                      }
                    },
                  },
                ],
                "secure-text",
              );
            },
          },
        ],
      );
    } else {
      Alert.alert(
        "Disable Biometric Login?",
        "This will remove your saved login credentials.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Disable",
            style: "destructive",
            onPress: async () => {
              await BiometricAuth.setBiometricEnabled(false);
              setBiometricEnabled(false);
              Alert.alert("Disabled", "Biometric login has been disabled.");
            },
          },
        ],
      );
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            console.error("Error signing out:", error);
          }
        },
      },
    ]);
  };

  const ProfileSection: React.FC<{
    title: string;
    children: React.ReactNode;
  }> = ({ title, children }) => (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          color: "#1f2937",
          marginBottom: 16,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );

  const SettingItem: React.FC<{
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    danger?: boolean;
  }> = ({ icon, title, subtitle, onPress, rightElement, danger = false }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          backgroundColor: danger ? "#fef2f2" : "#f3f4f6",
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Ionicons
          name={icon as any}
          size={20}
          color={danger ? "#ef4444" : "#6b7280"}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: danger ? "#ef4444" : "#1f2937",
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <LinearGradient
        colors={["#4facfe", "#00f2fe"]}
        style={{
          paddingHorizontal: 20,
          paddingVertical: 30,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <View
            style={{
              width: 80,
              height: 80,
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 40,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="person" size={40} color="white" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>
            {user?.name || "Driver"}
          </Text>
          <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
            {user?.email}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 8,
              backgroundColor: isAvailable ? "#22c55e" : "#ef4444",
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                backgroundColor: "white",
                borderRadius: 4,
                marginRight: 6,
              }}
            />
            <Text style={{ fontSize: 12, fontWeight: "600", color: "white" }}>
              {isAvailable ? "Available" : "Unavailable"}
            </Text>
          </View>
        </View>

        {/* Driver Stats */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "white" }}>
              {completedPickups.length}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
              Completed
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "white" }}>
              {totalBottles}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
              Bottles
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "white" }}>
              ${estimatedEarnings}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
              Earnings
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1, padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Availability Settings */}
        <ProfileSection title="Availability">
          <SettingItem
            icon="car-outline"
            title="Available for Pickups"
            subtitle={
              isAvailable
                ? "You will receive new pickup assignments"
                : "You won't receive new assignments"
            }
            rightElement={
              <Switch
                value={isAvailable}
                onValueChange={setIsAvailable}
                trackColor={{ false: "#e5e7eb", true: "#3b82f6" }}
                thumbColor={isAvailable ? "#ffffff" : "#f4f3f4"}
              />
            }
          />
        </ProfileSection>

        {/* Vehicle Information */}
        <ProfileSection title="Vehicle Information">
          <SettingItem
            icon="car-sport-outline"
            title="Vehicle Details"
            subtitle={user?.vehicleInfo || "Add vehicle information"}
            onPress={() =>
              Alert.alert(
                "Feature Coming Soon",
                "Vehicle management is coming soon!",
              )
            }
          />
          <SettingItem
            icon="location-outline"
            title="Current Location"
            subtitle="Update your current location"
            onPress={() =>
              Alert.alert(
                "Feature Coming Soon",
                "Location tracking is coming soon!",
              )
            }
          />
        </ProfileSection>

        {/* Notifications */}
        <ProfileSection title="Notifications">
          <SettingItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Receive notifications for new pickups"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#e5e7eb", true: "#3b82f6" }}
                thumbColor={notificationsEnabled ? "#ffffff" : "#f4f3f4"}
              />
            }
          />
          <SettingItem
            icon="mail-outline"
            title="Email Notifications"
            subtitle="Receive email updates"
            onPress={() =>
              Alert.alert(
                "Feature Coming Soon",
                "Email preferences coming soon!",
              )
            }
          />
        </ProfileSection>

        {/* Security Settings */}
        <ProfileSection title="Security & Privacy">
          {biometricAvailable && (
            <SettingItem
              icon="finger-print-outline"
              title="Biometric Login"
              subtitle={
                biometricEnabled
                  ? "Face ID/Touch ID login enabled"
                  : "Enable Face ID/Touch ID for quick login"
              }
              rightElement={
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: "#e5e7eb", true: "#3b82f6" }}
                  thumbColor={biometricEnabled ? "#ffffff" : "#f4f3f4"}
                />
              }
            />
          )}
        </ProfileSection>

        {/* Account */}
        <ProfileSection title="Account">
          <SettingItem
            icon="person-outline"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() =>
              Alert.alert(
                "Feature Coming Soon",
                "Profile editing is coming soon!",
              )
            }
          />
          <SettingItem
            icon="card-outline"
            title="Payment Information"
            subtitle="Manage your payment details"
            onPress={() =>
              Alert.alert(
                "Feature Coming Soon",
                "Payment management is coming soon!",
              )
            }
          />
          <SettingItem
            icon="shield-checkmark-outline"
            title="Privacy & Security"
            subtitle="Manage your privacy settings"
            onPress={() =>
              Alert.alert(
                "Feature Coming Soon",
                "Privacy settings coming soon!",
              )
            }
          />
        </ProfileSection>

        {/* Support */}
        <ProfileSection title="Support">
          <SettingItem
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="Get help with the app"
            onPress={() =>
              Alert.alert(
                "Support",
                "Contact support at support@timerecyclingservice.com",
              )
            }
          />
          <SettingItem
            icon="document-text-outline"
            title="Terms of Service"
            subtitle="Read our terms and conditions"
            onPress={() =>
              Alert.alert(
                "Feature Coming Soon",
                "Terms of service coming soon!",
              )
            }
          />
          <SettingItem
            icon="information-circle-outline"
            title="About"
            subtitle="Learn more about Time Recycling Service"
            onPress={() =>
              Alert.alert(
                "About",
                "Time Recycling Service v1.0.0\nBuilt with ❤️ for a sustainable future",
              )
            }
          />
        </ProfileSection>

        {/* Logout */}
        <ProfileSection title="Account Actions">
          <SettingItem
            icon="log-out-outline"
            title="Sign Out"
            subtitle="Sign out of your account"
            onPress={handleLogout}
            danger
            rightElement={<></>}
          />
        </ProfileSection>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};
