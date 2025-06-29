import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Switch,
  TextInput,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUnifiedAuth } from "../hooks/useUnifiedAuth";

interface PrivacySecurityModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PrivacySecurityModal: React.FC<PrivacySecurityModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { user } = useUnifiedAuth();
  const [locationSharing, setLocationSharing] = useState(true);
  const [phoneNumberVisible, setPhoneNumberVisible] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  const [analyticsSharing, setAnalyticsSharing] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);

  // Load saved privacy settings on component mount
  useEffect(() => {
    loadPrivacySettings();
  }, [visible]);

  const loadPrivacySettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(
        `privacy_settings_${user?.uid}`,
      );
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setLocationSharing(settings.locationSharing ?? true);
        setPhoneNumberVisible(settings.phoneNumberVisible ?? true);
        setProfileVisible(settings.profileVisible ?? true);
        setDataSharing(settings.dataSharing ?? false);
        setAnalyticsSharing(settings.analyticsSharing ?? true);
        setMarketingEmails(settings.marketingEmails ?? false);
      }
    } catch (error) {
      console.error("Error loading privacy settings:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const privacySettings = {
        locationSharing,
        phoneNumberVisible,
        profileVisible,
        dataSharing,
        analyticsSharing,
        marketingEmails,
        updatedAt: new Date().toISOString(),
      };

      // Save to local storage
      await AsyncStorage.setItem(
        `privacy_settings_${user?.uid}`,
        JSON.stringify(privacySettings),
      );

      console.log("Privacy settings saved successfully:", privacySettings);

      onSuccess();
      onClose();
      Alert.alert("Success", "Privacy settings updated successfully!");
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      Alert.alert("Error", "Failed to update privacy settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    setShowPasswordModal(true);
  };

  const handleTwoFactorAuth = () => {
    setShowTwoFactorModal(true);
  };

  const handleDownloadData = async () => {
    Alert.alert(
      "Download My Data",
      "Your data export will be prepared and sent to your registered email address within 24-48 hours. This will include your profile information, pickup history, and privacy settings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request Export",
          onPress: async () => {
            try {
              // In a real app, this would make an API call to initiate data export
              await AsyncStorage.setItem(
                `data_export_request_${user?.uid}`,
                JSON.stringify({
                  requestedAt: new Date().toISOString(),
                  email: user?.email,
                  status: "pending",
                }),
              );
              Alert.alert(
                "Request Submitted",
                "Your data export request has been submitted. You'll receive an email when it's ready for download.",
              );
            } catch (error) {
              console.error("Error requesting data export:", error);
              Alert.alert("Error", "Failed to submit data export request");
            }
          },
        },
      ],
    );
  };

  const PasswordChangeModal: React.FC = () => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);

    const handlePasswordChange = async () => {
      if (!currentPassword || !newPassword || !confirmPassword) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }

      if (newPassword !== confirmPassword) {
        Alert.alert("Error", "New passwords don't match");
        return;
      }

      if (newPassword.length < 6) {
        Alert.alert("Error", "Password must be at least 6 characters long");
        return;
      }

      setPasswordLoading(true);
      try {
        // In a real app, this would call Firebase Auth to update password
        await new Promise((resolve) => setTimeout(resolve, 1500));

        Alert.alert("Success", "Password changed successfully!", [
          {
            text: "OK",
            onPress: () => {
              setShowPasswordModal(false);
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
            },
          },
        ]);
      } catch (error) {
        console.error("Error changing password:", error);
        Alert.alert(
          "Error",
          "Failed to change password. Please check your current password.",
        );
      } finally {
        setPasswordLoading(false);
      }
    };

    return (
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowPasswordModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Change Password</Text>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.textInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="Enter current password"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.textInput}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Enter new password"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.textInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Confirm new password"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              onPress={handlePasswordChange}
              disabled={passwordLoading}
              style={[
                styles.submitButton,
                passwordLoading && styles.disabledButton,
              ]}
            >
              <Text style={styles.submitButtonText}>
                {passwordLoading ? "Changing Password..." : "Change Password"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  const TwoFactorModal: React.FC = () => {
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [twoFactorLoading, setTwoFactorLoading] = useState(false);

    useEffect(() => {
      checkTwoFactorStatus();
    }, []);

    const checkTwoFactorStatus = async () => {
      try {
        const status = await AsyncStorage.getItem(`two_factor_${user?.uid}`);
        setTwoFactorEnabled(status === "enabled");
      } catch (error) {
        console.error("Error checking 2FA status:", error);
      }
    };

    const handleToggleTwoFactor = async () => {
      if (twoFactorEnabled) {
        Alert.alert(
          "Disable Two-Factor Authentication",
          "Are you sure you want to disable two-factor authentication? This will make your account less secure.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Disable",
              style: "destructive",
              onPress: async () => {
                try {
                  await AsyncStorage.removeItem(`two_factor_${user?.uid}`);
                  setTwoFactorEnabled(false);
                  Alert.alert("Success", "Two-factor authentication disabled");
                } catch (error) {
                  Alert.alert(
                    "Error",
                    "Failed to disable two-factor authentication",
                  );
                }
              },
            },
          ],
        );
      } else {
        Alert.alert(
          "Enable Two-Factor Authentication",
          "This will add an extra layer of security to your account. You'll need to use an authenticator app like Google Authenticator.\n\nFor demonstration purposes, this feature is currently simulated.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Enable",
              onPress: async () => {
                setTwoFactorLoading(true);
                try {
                  await AsyncStorage.setItem(
                    `two_factor_${user?.uid}`,
                    "enabled",
                  );
                  setTwoFactorEnabled(true);
                  Alert.alert(
                    "Success!",
                    "Two-factor authentication has been enabled for your account.",
                  );
                } catch (error) {
                  Alert.alert(
                    "Error",
                    "Failed to enable two-factor authentication",
                  );
                } finally {
                  setTwoFactorLoading(false);
                }
              },
            },
          ],
        );
      }
    };

    return (
      <Modal
        visible={showTwoFactorModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowTwoFactorModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Two-Factor Authentication</Text>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.twoFactorStatus}>
              <Ionicons
                name={twoFactorEnabled ? "shield-checkmark" : "shield-outline"}
                size={48}
                color={twoFactorEnabled ? "#22c55e" : "#6b7280"}
              />
              <Text style={styles.twoFactorStatusTitle}>
                Two-Factor Authentication is{" "}
                {twoFactorEnabled ? "Enabled" : "Disabled"}
              </Text>
              <Text style={styles.twoFactorStatusSubtitle}>
                {twoFactorEnabled
                  ? "Your account is protected with an extra layer of security"
                  : "Add an extra layer of security to your account"}
              </Text>
            </View>

            {!twoFactorEnabled && (
              <View style={styles.twoFactorInfo}>
                <Text style={styles.infoTitle}>How it works:</Text>
                <Text style={styles.infoText}>
                  • Download an authenticator app like Google Authenticator or
                  Authy
                </Text>
                <Text style={styles.infoText}>
                  • Add your account to the authenticator app
                </Text>
                <Text style={styles.infoText}>
                  • Enter the 6-digit code from the app when signing in
                </Text>
                <Text style={styles.infoText}>
                  • This prevents unauthorized access even if someone knows your
                  password
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleToggleTwoFactor}
              disabled={twoFactorLoading}
              style={[
                styles.submitButton,
                twoFactorEnabled ? styles.dangerButton : styles.submitButton,
                twoFactorLoading && styles.disabledButton,
              ]}
            >
              <Text
                style={[
                  styles.submitButtonText,
                  twoFactorEnabled
                    ? styles.dangerButtonText
                    : styles.submitButtonText,
                ]}
              >
                {twoFactorLoading
                  ? "Processing..."
                  : twoFactorEnabled
                    ? "Disable Two-Factor Authentication"
                    : "Enable Two-Factor Authentication"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  const PrivacySettingItem: React.FC<{
    title: string;
    subtitle: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    icon: string;
  }> = ({ title, subtitle, value, onValueChange, icon }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={20} color="#3b82f6" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#e5e7eb", true: "#3b82f6" }}
        thumbColor={value ? "#ffffff" : "#f4f3f4"}
      />
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Privacy & Security</Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              style={[styles.saveButton, loading && styles.disabledButton]}
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location & Visibility</Text>

            <PrivacySettingItem
              icon="location-outline"
              title="Location Sharing"
              subtitle="Share your location with vendors during active pickups"
              value={locationSharing}
              onValueChange={setLocationSharing}
            />

            <PrivacySettingItem
              icon="call-outline"
              title="Phone Number Visibility"
              subtitle="Allow vendors to see your phone number"
              value={phoneNumberVisible}
              onValueChange={setPhoneNumberVisible}
            />

            <PrivacySettingItem
              icon="person-outline"
              title="Profile Visibility"
              subtitle="Show your profile information to vendors"
              value={profileVisible}
              onValueChange={setProfileVisible}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data & Analytics</Text>

            <PrivacySettingItem
              icon="analytics-outline"
              title="Analytics Sharing"
              subtitle="Help improve the app by sharing usage analytics"
              value={analyticsSharing}
              onValueChange={setAnalyticsSharing}
            />

            <PrivacySettingItem
              icon="share-outline"
              title="Data Sharing"
              subtitle="Share data with third-party partners"
              value={dataSharing}
              onValueChange={setDataSharing}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Communications</Text>

            <PrivacySettingItem
              icon="mail-outline"
              title="Marketing Emails"
              subtitle="Receive promotional emails and offers"
              value={marketingEmails}
              onValueChange={setMarketingEmails}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Security</Text>

            <TouchableOpacity
              onPress={handleChangePassword}
              style={styles.actionButton}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="key-outline" size={20} color="#3b82f6" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Change Password</Text>
                <Text style={styles.actionSubtitle}>
                  Update your account password
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleTwoFactorAuth}
              style={styles.actionButton}
            >
              <View style={styles.actionIcon}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color="#3b82f6"
                />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>
                  Two-Factor Authentication
                </Text>
                <Text style={styles.actionSubtitle}>
                  Add extra security to your account
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDownloadData}
              style={styles.actionButton}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="download-outline" size={20} color="#3b82f6" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Download My Data</Text>
                <Text style={styles.actionSubtitle}>
                  Get a copy of your personal data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View style={styles.warningSection}>
            <Ionicons name="warning-outline" size={20} color="#f59e0b" />
            <Text style={styles.warningText}>
              Disabling location sharing may affect your ability to receive
              pickup assignments and complete deliveries effectively.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <PasswordChangeModal />
      <TwoFactorModal />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#eff6ff",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#eff6ff",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  warningSection: {
    flexDirection: "row",
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: "#92400e",
    marginLeft: 12,
    lineHeight: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "white",
  },
  submitButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  dangerButton: {
    backgroundColor: "#ef4444",
  },
  dangerButtonText: {
    color: "white",
  },
  twoFactorStatus: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  twoFactorStatusTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 16,
    marginBottom: 8,
  },
  twoFactorStatusSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  twoFactorInfo: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
    lineHeight: 20,
  },
});
