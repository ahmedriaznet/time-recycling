import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateEmail,
  updateProfile,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db, serverTimestamp } from "../config/firebase";

interface DriverProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentName: string;
  currentEmail: string;
  currentPhone: string;
  userId: string;
}

export const DriverProfileEditModal: React.FC<DriverProfileEditModalProps> = ({
  visible,
  onClose,
  onSuccess,
  currentName,
  currentEmail,
  currentPhone = "",
  userId,
}) => {
  const [name, setName] = useState(currentName);
  const [email, setEmail] = useState(currentEmail);
  const [phone, setPhone] = useState(currentPhone);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [experience, setExperience] = useState("");
  const [loading, setLoading] = useState(false);

  // Password verification states
  const [currentPassword, setCurrentPassword] = useState("");
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [passwordVerifying, setPasswordVerifying] = useState(false);

  // Email verification states
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setName(currentName);
      setEmail(currentEmail);
      setPhone(currentPhone);
      setCurrentPassword("");
      setPasswordVerified(false);
      setEmailVerificationSent(false);
    }
  }, [visible, currentName, currentEmail, currentPhone]);

  const emailChanged =
    email.trim().toLowerCase() !== currentEmail.trim().toLowerCase();

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return false;
    }

    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }

    // Phone validation (optional but if provided, should be valid)
    if (phone.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
        Alert.alert("Error", "Please enter a valid phone number");
        return false;
      }
    }

    // If email changed, password must be verified and email verification must be sent
    if (emailChanged && !passwordVerified) {
      Alert.alert(
        "Error",
        "Please verify your current password to change your email address",
      );
      return false;
    }

    if (emailChanged && !emailVerificationSent) {
      Alert.alert(
        "Error",
        "Please send email verification to your new email address",
      );
      return false;
    }

    return true;
  };

  const handlePasswordVerification = async () => {
    if (!currentPassword.trim()) {
      Alert.alert("Error", "Please enter your current password");
      return;
    }

    setPasswordVerifying(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error("User not authenticated");
      }

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);

      setPasswordVerified(true);
      Alert.alert(
        "Success",
        "Password verified! You can now save your changes.",
      );
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
        Alert.alert("Error", "Failed to verify password. Please try again.");
      }
      setPasswordVerified(false);
    } finally {
      setPasswordVerifying(false);
    }
  };

  const handleSendEmailVerification = async () => {
    if (!passwordVerified) {
      Alert.alert("Error", "Please verify your current password first");
      return;
    }

    setEmailVerifying(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Send verification email to the new email address
      await verifyBeforeUpdateEmail(user, email.trim());

      setEmailVerificationSent(true);
      Alert.alert(
        "Verification Email Sent",
        `We've sent a verification email to ${email.trim()}.\n\n1. Check your email and click the verification link\n2. Return to this screen and click Save\n3. Your email will be updated automatically\n\nNote: You may be signed out temporarily during this process - this is normal for security.`,
        [{ text: "OK" }],
      );
    } catch (error: any) {
      console.error("Email verification failed:", error);
      if (error.code === "auth/email-already-in-use") {
        Alert.alert(
          "Error",
          "This email address is already in use by another account.",
        );
      } else if (error.code === "auth/invalid-email") {
        Alert.alert("Error", "Please enter a valid email address.");
      } else {
        Alert.alert(
          "Error",
          "Failed to send verification email. Please try again.",
        );
      }
      setEmailVerificationSent(false);
    } finally {
      setEmailVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      // If email changed, handle it differently
      if (emailChanged && passwordVerified && emailVerificationSent) {
        // For email changes, only update Firestore (email will be updated by Firebase after verification)
        Alert.alert(
          "Email Verification in Progress",
          "Your profile changes have been saved. Your email will be updated automatically once you verify it through the link sent to your new email address.",
          [
            {
              text: "OK",
              onPress: () => {
                onSuccess();
                onClose();
              },
            },
          ],
        );
      } else {
        // Normal profile update (no email change)
        // Update display name in Firebase Auth
        await updateProfile(user, {
          displayName: name.trim(),
        });
      }

      // Update user profile in Firestore
      const userRef = doc(db, "users", userId);
      const updateData: any = {
        name: name.trim(),
        phone: phone.trim(),
        updatedAt: serverTimestamp(),
      };

      // Only update email in Firestore if not changing (if changing, Firebase handles it)
      if (!emailChanged) {
        updateData.email = email.trim();
      }

      // Add license info if provided
      if (licenseNumber.trim()) {
        updateData.licenseNumber = licenseNumber.trim();
      }
      if (experience.trim()) {
        updateData.experience = experience.trim();
      }

      await updateDoc(userRef, updateData);
      console.log("✅ Profile updated in Firestore");

      if (!emailChanged) {
        onSuccess();
        onClose();
        Alert.alert("Success", "Profile updated successfully!");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      if (
        error.code === "auth/user-token-expired" ||
        error.code === "auth/user-not-found"
      ) {
        Alert.alert(
          "Session Expired",
          "Your session expired during the email verification process. Your changes have been saved. Please sign in again to continue.",
          [
            {
              text: "OK",
              onPress: () => {
                onClose();
                // The auth context will handle the sign-out state
              },
            },
          ],
        );
      } else if (error.code === "auth/email-already-in-use") {
        Alert.alert(
          "Error",
          "This email address is already in use by another account.",
        );
      } else if (error.code === "auth/invalid-email") {
        Alert.alert("Error", "Please enter a valid email address.");
      } else {
        Alert.alert("Error", "Failed to update profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset verification states when email changes
  React.useEffect(() => {
    if (emailChanged) {
      setPasswordVerified(false);
      setEmailVerificationSent(false);
      setCurrentPassword("");
    }
  }, [emailChanged]);

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
            <Text style={styles.headerTitle}>Edit Profile</Text>
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

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email address"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />

              {emailChanged && (
                <View style={styles.passwordVerificationSection}>
                  <View style={styles.warningBox}>
                    <Ionicons
                      name="warning-outline"
                      size={16}
                      color="#f59e0b"
                    />
                    <Text style={styles.warningText}>
                      You're changing your email address. Please verify your
                      current password.
                    </Text>
                  </View>

                  <View style={styles.passwordVerificationRow}>
                    <TextInput
                      style={[
                        styles.passwordInput,
                        passwordVerified && styles.verifiedInput,
                      ]}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholder="Enter current password"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry
                      autoCapitalize="none"
                      autoComplete="current-password"
                      editable={!passwordVerified}
                    />

                    {passwordVerified ? (
                      <View style={styles.verifiedBadge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#22c55e"
                        />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={handlePasswordVerification}
                        disabled={passwordVerifying || !currentPassword.trim()}
                        style={[
                          styles.validateButton,
                          (passwordVerifying || !currentPassword.trim()) &&
                            styles.disabledButton,
                        ]}
                      >
                        <Text style={styles.validateButtonText}>
                          {passwordVerifying ? "Verifying..." : "Validate"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {passwordVerified && (
                    <View style={styles.emailVerificationSection}>
                      <Text style={styles.verificationStepTitle}>
                        Step 2: Verify New Email Address
                      </Text>

                      {emailVerificationSent ? (
                        <View style={styles.verificationSentBox}>
                          <Ionicons
                            name="mail-outline"
                            size={20}
                            color="#3b82f6"
                          />
                          <View style={styles.verificationSentContent}>
                            <Text style={styles.verificationSentTitle}>
                              Verification Email Sent!
                            </Text>
                            <Text style={styles.verificationSentText}>
                              Check your email at {email.trim()} and click the
                              verification link. Once verified, you can save
                              your profile.
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={handleSendEmailVerification}
                          disabled={emailVerifying}
                          style={[
                            styles.verifyEmailButton,
                            emailVerifying && styles.disabledButton,
                          ]}
                        >
                          <Ionicons
                            name="mail-outline"
                            size={18}
                            color="white"
                          />
                          <Text style={styles.verifyEmailButtonText}>
                            {emailVerifying
                              ? "Sending..."
                              : "Send Verification Email"}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Driver's License Number</Text>
              <TextInput
                style={styles.input}
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                placeholder="Enter your license number"
                placeholderTextColor="#9ca3af"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Driving Experience</Text>
              <TextInput
                style={styles.input}
                value={experience}
                onChangeText={setExperience}
                placeholder="e.g., 5 years commercial driving"
                placeholderTextColor="#9ca3af"
                autoCapitalize="sentences"
              />
            </View>
          </View>

          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>Privacy & Security</Text>
            <Text style={styles.helpText}>
              • Your personal information is kept secure{"\n"}• Driver's license
              number is only visible to you and administrators{"\n"}• Vendors
              only see your name and avatar when you accept pickups{"\n"}• All
              sensitive data is encrypted and protected{"\n"}• Email changes
              require password verification for security
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
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
  form: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1f2937",
    backgroundColor: "#ffffff",
  },
  passwordVerificationSection: {
    marginTop: 12,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#fbbf24",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    color: "#92400e",
    marginLeft: 8,
    flex: 1,
  },
  passwordVerificationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1f2937",
    backgroundColor: "#ffffff",
  },
  verifiedInput: {
    borderColor: "#22c55e",
    backgroundColor: "#f0fdf4",
  },
  validateButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  validateButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#22c55e",
  },
  verifiedText: {
    color: "#166534",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  helpSection: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  emailVerificationSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  verificationStepTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  verifyEmailButton: {
    backgroundColor: "#3b82f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  verifyEmailButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  verificationSentBox: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 8,
    padding: 12,
    alignItems: "flex-start",
  },
  verificationSentContent: {
    flex: 1,
    marginLeft: 12,
  },
  verificationSentTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e40af",
    marginBottom: 4,
  },
  verificationSentText: {
    fontSize: 12,
    color: "#1e40af",
    lineHeight: 16,
  },
});
