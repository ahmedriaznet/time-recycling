import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../contexts/AuthContextFirebase";
import {
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { PhoneInput } from "./PhoneInput";
import { useNotification } from "../contexts/NotificationContext";

interface BaseEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface EditEmailModalProps extends BaseEditModalProps {
  currentEmail: string;
}

interface EditPhoneModalProps extends BaseEditModalProps {
  currentPhone: string;
  userId: string;
}

interface EditPasswordModalProps extends BaseEditModalProps {}

interface EditBusinessNameModalProps extends BaseEditModalProps {
  currentBusinessName: string;
  userId: string;
}

interface EditBusinessCategoryModalProps extends BaseEditModalProps {
  currentCategory: string;
  userId: string;
}

interface EditBusinessLocationModalProps extends BaseEditModalProps {
  currentLocation: string;
  userId: string;
}

// Email Edit Modal
export const EditEmailModal: React.FC<EditEmailModalProps> = ({
  visible,
  onClose,
  onSuccess,
  currentEmail,
}) => {
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleSave = async () => {
    if (!newEmail.trim()) {
      showNotification({
        type: "error",
        title: "Missing Email",
        message: "Please enter a new email address",
      });
      return;
    }

    if (!password.trim()) {
      showNotification({
        type: "error",
        title: "Password Required",
        message: "Please enter your current password to verify",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      showNotification({
        type: "error",
        title: "Invalid Email",
        message: "Please enter a valid email address",
      });
      return;
    }

    if (newEmail === currentEmail) {
      showNotification({
        type: "error",
        title: "Same Email",
        message: "New email must be different from current email",
      });
      return;
    }

    setLoading(true);

    try {
      if (!auth.currentUser) {
        throw new Error("No authenticated user");
      }

      const credential = EmailAuthProvider.credential(currentEmail, password);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updateEmail(auth.currentUser, newEmail);

      if (db) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          email: newEmail,
        });
      }

      showNotification({
        type: "success",
        title: "Email Updated",
        message: "Email address updated successfully",
      });
      setNewEmail("");
      setPassword("");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error updating email:", error);
      if (error.code === "auth/wrong-password") {
        showNotification({
          type: "error",
          title: "Incorrect Password",
          message: "Please try again with the correct password.",
        });
      } else if (error.code === "auth/email-already-in-use") {
        showNotification({
          type: "error",
          title: "Email Already Used",
          message: "This email is already in use by another account.",
        });
      } else if (error.code === "auth/invalid-email") {
        showNotification({
          type: "error",
          title: "Invalid Email",
          message: "Invalid email address format.",
        });
      } else {
        showNotification({
          type: "error",
          title: "Update Failed",
          message: "Failed to update email. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
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
            borderRadius: 20,
            padding: 24,
            width: "100%",
            maxWidth: 400,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text
              style={{ fontSize: 20, fontWeight: "bold", color: "#1f2937" }}
            >
              Update Email
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>
            Current email: {currentEmail}
          </Text>

          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#374151",
                marginBottom: 8,
              }}
            >
              New Email Address
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                backgroundColor: "#f9fafb",
              }}
              placeholder="Enter new email address"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#374151",
                marginBottom: 8,
              }}
            >
              Current Password (for verification)
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                backgroundColor: "#f9fafb",
              }}
              placeholder="Enter your current password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
            />
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                backgroundColor: "#f3f4f6",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: "#374151" }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: loading ? "#9ca3af" : "#3b82f6",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "white" }}
                >
                  Update Email
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Phone Edit Modal
export const EditPhoneModal: React.FC<EditPhoneModalProps> = ({
  visible,
  onClose,
  onSuccess,
  currentPhone,
  userId,
}) => {
  const [newPhone, setNewPhone] = useState(currentPhone || "+1 ");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!newPhone.trim()) {
      Alert.alert("Error", "Please enter a phone number");
      return;
    }

    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(newPhone.trim())) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    if (newPhone.trim() === currentPhone) {
      Alert.alert(
        "Error",
        "New phone number must be different from current number",
      );
      return;
    }
    try {
      if (!db) {
        throw new Error("Firestore not available");
      }

      await updateDoc(doc(db, "users", userId), {
        phone: newPhone.trim(),
      });

      Alert.alert("Success", "Phone number updated successfully");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating phone:", error);
      Alert.alert("Error", "Failed to update phone number. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
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
            borderRadius: 20,
            padding: 24,
            width: "100%",
            maxWidth: 400,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text
              style={{ fontSize: 20, fontWeight: "bold", color: "#1f2937" }}
            >
              Update Phone
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: 24 }}>
            <PhoneInput
              label="Phone Number"
              value={newPhone}
              onChangeText={setNewPhone}
              placeholder="Enter phone number"
            />
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                backgroundColor: "#f3f4f6",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: "#374151" }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: loading ? "#9ca3af" : "#3b82f6",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "white" }}
                >
                  Update Phone
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Password Edit Modal
export const EditPasswordModal: React.FC<EditPasswordModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!currentPassword.trim()) {
      Alert.alert("Error", "Please enter your current password");
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert("Error", "Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    if (newPassword === currentPassword) {
      Alert.alert(
        "Error",
        "New password must be different from current password",
      );
      return;
    }

    setLoading(true);

    try {
      if (!auth.currentUser) {
        throw new Error("No authenticated user");
      }

      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        currentPassword,
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);

      Alert.alert("Success", "Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error updating password:", error);
      if (error.code === "auth/wrong-password") {
        Alert.alert(
          "Error",
          "Current password is incorrect. Please try again.",
        );
      } else if (error.code === "auth/weak-password") {
        Alert.alert(
          "Error",
          "New password is too weak. Please choose a stronger password.",
        );
      } else {
        Alert.alert("Error", "Failed to update password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
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
            borderRadius: 20,
            padding: 24,
            width: "100%",
            maxWidth: 400,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text
              style={{ fontSize: 20, fontWeight: "bold", color: "#1f2937" }}
            >
              Change Password
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#374151",
                marginBottom: 8,
              }}
            >
              Current Password
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                backgroundColor: "#f9fafb",
              }}
              placeholder="Enter current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoComplete="current-password"
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#374151",
                marginBottom: 8,
              }}
            >
              New Password
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                backgroundColor: "#f9fafb",
              }}
              placeholder="Enter new password (min 6 characters)"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoComplete="new-password"
            />
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#374151",
                marginBottom: 8,
              }}
            >
              Confirm New Password
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                backgroundColor: "#f9fafb",
              }}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
            />
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                backgroundColor: "#f3f4f6",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: "#374151" }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: loading ? "#9ca3af" : "#3b82f6",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "white" }}
                >
                  Update Password
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Business Name Edit Modal
export const EditBusinessNameModal: React.FC<EditBusinessNameModalProps> = ({
  visible,
  onClose,
  onSuccess,
  currentBusinessName,
  userId,
}) => {
  const [newBusinessName, setNewBusinessName] = useState(currentBusinessName);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!newBusinessName.trim()) {
      Alert.alert("Error", "Please enter a business name");
      return;
    }

    if (newBusinessName.trim() === currentBusinessName) {
      Alert.alert(
        "Error",
        "New business name must be different from current name",
      );
      return;
    }

    setLoading(true);

    try {
      if (!db) {
        throw new Error("Firestore not available");
      }

      await updateDoc(doc(db, "users", userId), {
        businessName: newBusinessName.trim(),
      });

      Alert.alert("Success", "Business name updated successfully");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating business name:", error);
      Alert.alert("Error", "Failed to update business name. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
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
            borderRadius: 20,
            padding: 24,
            width: "100%",
            maxWidth: 400,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text
              style={{ fontSize: 20, fontWeight: "bold", color: "#1f2937" }}
            >
              Update Business Name
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#374151",
                marginBottom: 8,
              }}
            >
              Business Name
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                backgroundColor: "#f9fafb",
              }}
              placeholder="Enter business name"
              value={newBusinessName}
              onChangeText={setNewBusinessName}
              autoCapitalize="words"
            />
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                backgroundColor: "#f3f4f6",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: "#374151" }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: loading ? "#9ca3af" : "#3b82f6",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "white" }}
                >
                  Update Name
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Business Category Edit Modal
export const EditBusinessCategoryModal: React.FC<
  EditBusinessCategoryModalProps
> = ({ visible, onClose, onSuccess, currentCategory, userId }) => {
  const [selectedCategory, setSelectedCategory] = useState(currentCategory);
  const [loading, setLoading] = useState(false);

  const businessCategories = [
    "Restaurant",
    "Bar & Pub",
    "Hotel",
    "Cafe & Coffee Shop",
    "Fast Food",
    "Fine Dining",
    "Brewery",
    "Winery",
    "Catering Service",
    "Food Truck",
    "Event Venue",
    "Retail Store",
    "Other",
  ];

  const handleSave = async () => {
    if (!selectedCategory) {
      Alert.alert("Error", "Please select a business category");
      return;
    }

    if (selectedCategory === currentCategory) {
      Alert.alert("Error", "Please select a different category");
      return;
    }

    setLoading(true);

    try {
      if (!db) {
        throw new Error("Firestore not available");
      }

      await updateDoc(doc(db, "users", userId), {
        businessCategory: selectedCategory,
      });

      Alert.alert("Success", "Business category updated successfully");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating business category:", error);
      Alert.alert(
        "Error",
        "Failed to update business category. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
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
            borderRadius: 20,
            padding: 24,
            width: "100%",
            maxWidth: 400,
            maxHeight: "80%",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text
              style={{ fontSize: 20, fontWeight: "bold", color: "#1f2937" }}
            >
              Business Category
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 300, marginBottom: 24 }}>
            {businessCategories.map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  marginBottom: 8,
                  backgroundColor:
                    selectedCategory === category ? "#eff6ff" : "transparent",
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor:
                      selectedCategory === category ? "#3b82f6" : "#d1d5db",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  {selectedCategory === category && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: "#3b82f6",
                      }}
                    />
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 16,
                    color:
                      selectedCategory === category ? "#3b82f6" : "#374151",
                    fontWeight: selectedCategory === category ? "600" : "400",
                  }}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                backgroundColor: "#f3f4f6",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: "#374151" }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: loading ? "#9ca3af" : "#3b82f6",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "white" }}
                >
                  Update Category
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Business Location Edit Modal
export const EditBusinessLocationModal: React.FC<
  EditBusinessLocationModalProps
> = ({ visible, onClose, onSuccess, currentLocation, userId }) => {
  const [newLocation, setNewLocation] = useState(currentLocation);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!newLocation.trim()) {
      Alert.alert("Error", "Please enter a business location");
      return;
    }

    if (newLocation.trim() === currentLocation) {
      Alert.alert(
        "Error",
        "New location must be different from current location",
      );
      return;
    }

    setLoading(true);

    try {
      if (!db) {
        throw new Error("Firestore not available");
      }

      await updateDoc(doc(db, "users", userId), {
        businessLocation: newLocation.trim(),
      });

      Alert.alert("Success", "Business location updated successfully");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating business location:", error);
      Alert.alert(
        "Error",
        "Failed to update business location. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
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
            borderRadius: 20,
            padding: 24,
            width: "100%",
            maxWidth: 400,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text
              style={{ fontSize: 20, fontWeight: "bold", color: "#1f2937" }}
            >
              Business Location
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#374151",
                marginBottom: 8,
              }}
            >
              Business Address
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                backgroundColor: "#f9fafb",
              }}
              placeholder="Enter business address"
              value={newLocation}
              onChangeText={setNewLocation}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Action Buttons */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 24,
              gap: 12,
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                backgroundColor: "#f3f4f6",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: "#374151" }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: loading ? "#9ca3af" : "#3b82f6",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "white" }}
                >
                  Update Location
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
