import React, { useState, useEffect } from "react";
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

import {
  EditEmailModal,
  EditPhoneModal,
  EditPasswordModal,
  EditBusinessNameModal,
  EditBusinessCategoryModal,
  EditBusinessLocationModal,
} from "../../components/EditProfileModals";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { BiometricAuth } from "../../utils/BiometricAuth";
import { reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";

interface UserProfile {
  uid: string;
  email: string;
  role: "vendor" | "driver";
  name: string;
  phone?: string;
  businessName?: string;
  businessCategory?: string;
  businessLocation?: string;
  createdAt: string;
}

export const VendorProfileScreen: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [showEditEmail, setShowEditEmail] = useState(false);
  const [showEditPhone, setShowEditPhone] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditBusinessName, setShowEditBusinessName] = useState(false);
  const [showEditBusinessCategory, setShowEditBusinessCategory] =
    useState(false);
  const [showEditBusinessLocation, setShowEditBusinessLocation] =
    useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const { user, signOut } = useUnifiedAuth();

  useEffect(() => {
    loadUserProfile();
    checkBiometricAvailability();
  }, [user]);

  const checkBiometricAvailability = async () => {
    const available = await BiometricAuth.isAvailable();
    const enabled = await BiometricAuth.isBiometricEnabled();
    setBiometricAvailable(available);
    setBiometricEnabled(enabled);
  };

  const loadUserProfile = async () => {
    if (!user || !db) {
      console.log("📱 No user or database available");
      return;
    }

    try {
      console.log("🔥 Loading user profile from Firebase...");
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserProfile({
          uid: user.uid,
          email: userData.email || user.email,
          role: userData.role || "vendor",
          name: userData.name || user.name,
          phone: userData.phone || user.phone,
          businessName: userData.businessName || user.businessName,
          businessCategory: userData.businessCategory || "",
          businessLocation: userData.businessLocation || "",
          createdAt:
            userData.createdAt?.toDate()?.toISOString() ||
            new Date().toISOString(),
        });
        console.log("✅ User profile loaded from Firebase");
      } else {
        // Fallback to auth user data
        setUserProfile({
          uid: user.uid,
          email: user.email || "",
          role: "vendor",
          name: user.name || "",
          phone: user.phone || "",
          businessName: user.businessName || "",
          businessCategory: "",
          businessLocation: "",
          createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
        });
        console.log("⚠️ User document not found, using auth data");
      }
    } catch (error) {
      console.error("❌ Error loading user profile:", error);
      // Fallback to auth user data
      if (user) {
        setUserProfile({
          uid: user.uid,
          email: user.email || "",
          role: "vendor",
          name: user.name || "",
          phone: user.phone || "",
          businessName: user.businessName || "",
          businessCategory: "",
          businessLocation: "",
          createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
        });
      }
    }
  };

  const handleRefreshProfile = async () => {
    setRefreshing(true);
    await loadUserProfile();
    setRefreshing(false);
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (enabled) {
      // Enable biometric login
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
              // Prompt for password to validate and save credentials
              Alert.prompt(
                "Verify Password",
                "Please enter your current password to enable biometric login",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Verify & Enable",
                    onPress: async (password) => {
                      if (!password || !userProfile?.email) {
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
                          userProfile.email,
                          password,
                        );

                        // This will throw an error if password is wrong
                        await reauthenticateWithCredential(
                          currentUser,
                          credential,
                        );

                        // Password is correct, now save credentials for biometric login
                        const success = await BiometricAuth.saveCredentials({
                          email: userProfile.email,
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
      // Disable biometric login
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
    editable?: boolean;
  }> = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement,
    danger = false,
    editable = false,
  }) => (
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
          backgroundColor: danger
            ? "#fef2f2"
            : editable
              ? "#eff6ff"
              : "#f3f4f6",
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Ionicons
          name={icon as any}
          size={20}
          color={danger ? "#ef4444" : editable ? "#3b82f6" : "#6b7280"}
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
        <Ionicons
          name={editable ? "create-outline" : "chevron-forward"}
          size={20}
          color={editable ? "#3b82f6" : "#9ca3af"}
        />
      )}
    </TouchableOpacity>
  );

  if (!userProfile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ fontSize: 16, color: "#6b7280" }}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
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
            <Ionicons name="business" size={40} color="white" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>
            {userProfile.name}
          </Text>
          <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
            {userProfile.businessName}
          </Text>
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
            {userProfile.email}
          </Text>
          {userProfile.businessCategory && (
            <Text
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.6)",
                marginTop: 4,
              }}
            >
              {userProfile.businessCategory}
            </Text>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1, padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Information */}
        <ProfileSection title="Account Information">
          <SettingItem
            icon="mail-outline"
            title="Email Address"
            subtitle={userProfile.email}
            onPress={() => setShowEditEmail(true)}
            editable
          />
          <SettingItem
            icon="call-outline"
            title="Phone Number"
            subtitle={userProfile.phone || "Add phone number"}
            onPress={() => setShowEditPhone(true)}
            editable
          />
          <SettingItem
            icon="lock-closed-outline"
            title="Password"
            subtitle="Change your password"
            onPress={() => setShowEditPassword(true)}
            editable
          />
          <SettingItem
            icon="business-outline"
            title="Business Name"
            subtitle={userProfile.businessName || "Add business name"}
            onPress={() => setShowEditBusinessName(true)}
            editable
          />
        </ProfileSection>

        {/* Notifications */}
        <ProfileSection title="Notifications">
          <SettingItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Receive notifications for pickup updates"
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
            title="Email Updates"
            subtitle="Receive email notifications"
            rightElement={
              <Switch
                value={emailUpdates}
                onValueChange={setEmailUpdates}
                trackColor={{ false: "#e5e7eb", true: "#3b82f6" }}
                thumbColor={emailUpdates ? "#ffffff" : "#f4f3f4"}
              />
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

        {/* Business Settings */}
        <ProfileSection title="Business Settings">
          <SettingItem
            icon="list-outline"
            title="Business Category"
            subtitle={
              userProfile.businessCategory || "Select business category"
            }
            onPress={() => setShowEditBusinessCategory(true)}
            editable
          />
          <SettingItem
            icon="location-outline"
            title="Business Location"
            subtitle={userProfile.businessLocation || "Add business address"}
            onPress={() => setShowEditBusinessLocation(true)}
            editable
          />
        </ProfileSection>

        {/* Support */}
        <ProfileSection title="Support & Legal">
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
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            subtitle="Learn about our privacy practices"
            onPress={() =>
              Alert.alert("Feature Coming Soon", "Privacy policy coming soon!")
            }
          />
        </ProfileSection>

        {/* Account Actions */}
        <ProfileSection title="Account Actions">
          <SettingItem
            icon="refresh-outline"
            title="Refresh Profile"
            subtitle="Reload your profile data"
            onPress={handleRefreshProfile}
          />
          <SettingItem
            icon="log-out-outline"
            title="Sign Out"
            subtitle="Sign out of your account"
            onPress={handleLogout}
            danger
          />
        </ProfileSection>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Modals */}
      <EditEmailModal
        visible={showEditEmail}
        onClose={() => setShowEditEmail(false)}
        onSuccess={handleRefreshProfile}
        currentEmail={userProfile.email}
      />

      <EditPhoneModal
        visible={showEditPhone}
        onClose={() => setShowEditPhone(false)}
        onSuccess={handleRefreshProfile}
        currentPhone={userProfile.phone || ""}
        userId={userProfile.uid}
      />

      <EditPasswordModal
        visible={showEditPassword}
        onClose={() => setShowEditPassword(false)}
        onSuccess={() => {
          // Password change doesn't require profile refresh
          Alert.alert(
            "Success",
            "Password updated successfully. Please remember your new password.",
          );
        }}
      />

      <EditBusinessNameModal
        visible={showEditBusinessName}
        onClose={() => setShowEditBusinessName(false)}
        onSuccess={handleRefreshProfile}
        currentBusinessName={userProfile.businessName || ""}
        userId={userProfile.uid}
      />

      <EditBusinessCategoryModal
        visible={showEditBusinessCategory}
        onClose={() => setShowEditBusinessCategory(false)}
        onSuccess={handleRefreshProfile}
        currentCategory={userProfile.businessCategory || ""}
        userId={userProfile.uid}
      />

      <EditBusinessLocationModal
        visible={showEditBusinessLocation}
        onClose={() => setShowEditBusinessLocation(false)}
        onSuccess={handleRefreshProfile}
        currentLocation={userProfile.businessLocation || ""}
        userId={userProfile.uid}
      />
    </SafeAreaView>
  );
};
