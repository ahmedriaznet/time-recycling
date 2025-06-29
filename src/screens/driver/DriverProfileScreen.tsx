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
import { auth, db } from "../../config/firebase";
import {
  doc,
  updateDoc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { TermsOfServiceModal } from "../../components/TermsOfServiceModal";
import { PrivacyPolicyModal } from "../../components/PrivacyPolicyModal";
import { VehicleDetailsModal } from "../../components/VehicleDetailsModal";
import { DriverProfileEditModal } from "../../components/DriverProfileEditModal";
import { PrivacySecurityModal } from "../../components/PrivacySecurityModal";
import {
  AvatarSelectionModal,
  AvatarOption,
} from "../../components/AvatarSelectionModal";
import { UserAvatar, useUserAvatar } from "../../components/UserAvatar";

export const DriverProfileScreen: React.FC = () => {
  const { user, signOut } = useUnifiedAuth();
  const { getPickupsForDriver } = useFirebasePickupStore();
  const [isAvailable, setIsAvailable] = useState(true);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showVehicleDetails, setShowVehicleDetails] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showPrivacySecurity, setShowPrivacySecurity] = useState(false);
  const [showAvatarSelection, setShowAvatarSelection] = useState(false);

  // Get user avatar
  const { avatar, refreshAvatar } = useUserAvatar(user?.uid || "");

  React.useEffect(() => {
    const loadUserSettings = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsAvailable(userData.isAvailable !== false); // Default to true
            setNotificationsEnabled(
              userData.pushNotificationsEnabled !== false,
            ); // Default to true
          }
        } catch (error) {
          console.error("Error loading user settings:", error);
        }
      }
    };

    loadUserSettings();
  }, [user?.uid]);

  // Separate useEffect for biometric settings
  React.useEffect(() => {
    const checkBiometric = async () => {
      const available = await BiometricAuth.isAvailable();
      const enabled = await BiometricAuth.isBiometricEnabled();
      setBiometricAvailable(available);
      setBiometricEnabled(enabled);
    };
    checkBiometric();
  }, []);
  const handleAvailabilityChange = async (newAvailability: boolean) => {
    if (!user?.uid) return;

    // Optimistically update UI first for seamless experience
    setIsAvailable(newAvailability);
    setSavingAvailability(true);

    try {
      // Update user availability status
      await updateDoc(doc(db, "users", user.uid), {
        isAvailable: newAvailability,
        lastAvailabilityChange: serverTimestamp(),
      });

      // Log availability change to history
      await addDoc(collection(db, "availabilityHistory"), {
        userId: user.uid,
        userName: user.name,
        userEmail: user.email,
        isAvailable: newAvailability,
        timestamp: serverTimestamp(),
        previousStatus: !newAvailability, // Previous status is opposite of new
      });
    } catch (error) {
      console.error("Error updating availability:", error);
      // Revert the optimistic update on error
      setIsAvailable(!newAvailability);
      Alert.alert("Error", "Failed to update availability status");
    } finally {
      setSavingAvailability(false);
    }
  };

  // Get driver stats
  const allPickups = getPickupsForDriver(user?.uid || "");
  const completedPickups = allPickups.filter((p) => p.status === "completed");
  const totalBottles = completedPickups.reduce(
    (sum, p) => sum + p.bottleCount,
    0,
  );

  const handleNotificationToggle = async (enabled: boolean) => {
    try {
      if (user?.uid) {
        await updateDoc(doc(db, "users", user.uid), {
          pushNotificationsEnabled: enabled,
        });
        setNotificationsEnabled(enabled);

        showNotification({
          type: "success",
          title: enabled ? "Notifications Enabled" : "Notifications Disabled",
          message: enabled
            ? "You'll receive push notifications for new pickups"
            : "Push notifications have been turned off",
        });
      }
    } catch (error) {
      console.error("Error updating notification settings:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to update notification settings",
      });
    }
  };

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

  const handleAvatarSelect = (selectedAvatar: AvatarOption) => {
    refreshAvatar();
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
          <TouchableOpacity
            onPress={() => setShowAvatarSelection(true)}
            style={{
              width: 80,
              height: 80,
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 40,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              position: "relative",
            }}
          >
            {avatar ? (
              <Text style={{ fontSize: 48 }}>{avatar.emoji}</Text>
            ) : (
              <Ionicons name="person" size={40} color="white" />
            )}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                backgroundColor: "white",
                borderRadius: 12,
                width: 24,
                height: 24,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="camera" size={12} color="#3b82f6" />
            </View>
          </TouchableOpacity>
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
              opacity: savingAvailability ? 0.7 : 1,
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
              {savingAvailability
                ? "Updating..."
                : isAvailable
                  ? "Available"
                  : "Unavailable"}
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
              savingAvailability
                ? "Updating availability status..."
                : isAvailable
                  ? "You will receive new pickup assignments"
                  : "You won't receive new assignments"
            }
            rightElement={
              <View style={{ opacity: savingAvailability ? 0.5 : 1 }}>
                <Switch
                  value={isAvailable}
                  onValueChange={handleAvailabilityChange}
                  disabled={savingAvailability}
                  trackColor={{ false: "#e5e7eb", true: "#22c55e" }}
                  thumbColor={isAvailable ? "#ffffff" : "#f4f3f4"}
                />
              </View>
            }
          />
        </ProfileSection>

        {/* Profile Settings */}
        <ProfileSection title="Profile">
          <SettingItem
            icon="person-circle-outline"
            title="Profile Information"
            subtitle="Update your personal information"
            onPress={() => setShowProfileEdit(true)}
          />
          <SettingItem
            icon="happy-outline"
            title="Choose Avatar"
            subtitle={avatar ? `Current: ${avatar.name}` : "Select your avatar"}
            onPress={() => setShowAvatarSelection(true)}
          />
        </ProfileSection>

        {/* Vehicle Information */}
        <ProfileSection title="Vehicle Information">
          <SettingItem
            icon="car-sport-outline"
            title="Vehicle Details"
            subtitle={user?.vehicleInfo || "Add vehicle information"}
            onPress={() => setShowVehicleDetails(true)}
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
                onValueChange={handleNotificationToggle}
                trackColor={{ false: "#e5e7eb", true: "#3b82f6" }}
                thumbColor={notificationsEnabled ? "#ffffff" : "#f4f3f4"}
              />
            }
          />
        </ProfileSection>

        {/* Security Settings */}
        <ProfileSection title="Security & Privacy">
          <SettingItem
            icon="shield-outline"
            title="Privacy & Security Settings"
            subtitle="Manage your privacy preferences and security"
            onPress={() => setShowPrivacySecurity(true)}
            editable
          />
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

        {/* Support */}
        <ProfileSection title="Support">
          <SettingItem
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="Get help with the app"
            onPress={() =>
              Alert.alert(
                "Support",
                "For support, please contact your administrator or check the app settings for assistance.",
              )
            }
          />
          <SettingItem
            icon="document-text-outline"
            title="Terms of Service"
            subtitle="Read our terms and conditions"
            onPress={() => setShowTermsOfService(true)}
          />
          <SettingItem
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            subtitle="Learn about our privacy practices"
            onPress={() => setShowPrivacyPolicy(true)}
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

      <TermsOfServiceModal
        visible={showTermsOfService}
        onClose={() => setShowTermsOfService(false)}
      />

      <PrivacyPolicyModal
        visible={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
      />

      <VehicleDetailsModal
        visible={showVehicleDetails}
        onClose={() => setShowVehicleDetails(false)}
        onSuccess={() => {
          // Reload user data or update state
          Alert.alert("Success", "Vehicle details updated!");
        }}
        currentVehicleInfo={user?.vehicleInfo || ""}
        userId={user?.uid || ""}
      />

      <DriverProfileEditModal
        visible={showProfileEdit}
        onClose={() => setShowProfileEdit(false)}
        onSuccess={() => {
          // Reload user data or update state
          Alert.alert("Success", "Profile updated!");
        }}
        currentName={user?.name || ""}
        currentEmail={user?.email || ""}
        currentPhone={user?.phone || ""}
        userId={user?.uid || ""}
      />

      <PrivacySecurityModal
        visible={showPrivacySecurity}
        onClose={() => setShowPrivacySecurity(false)}
        onSuccess={() => {
          Alert.alert("Success", "Privacy settings updated!");
        }}
      />

      <AvatarSelectionModal
        visible={showAvatarSelection}
        onClose={() => setShowAvatarSelection(false)}
        onSelectAvatar={handleAvatarSelect}
        currentAvatar={avatar?.id}
        userId={user?.uid || ""}
      />
    </SafeAreaView>
  );
};
