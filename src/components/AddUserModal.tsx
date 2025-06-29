import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, serverTimestamp } from "../config/firebase";

interface AddUserModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"driver" | "vendor">(
    "driver",
  );
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    businessCategory: "",
    vehicleInfo: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      businessName: "",
      businessCategory: "",
      vehicleInfo: "",
    });
    setSelectedRole("driver");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const generateTemporaryPassword = () => {
    // Generate a temporary password
    return Math.random().toString(36).slice(-8) + "TRS!";
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter the user's full name");
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert("Error", "Please enter the user's email address");
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert("Error", "Please enter the user's phone number");
      return false;
    }
    if (selectedRole === "vendor" && !formData.businessName.trim()) {
      Alert.alert("Error", "Please enter the business name for vendors");
      return false;
    }
    if (selectedRole === "driver" && !formData.vehicleInfo.trim()) {
      Alert.alert("Error", "Please enter vehicle information for drivers");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const tempPassword = generateTemporaryPassword();

    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim(),
        tempPassword,
      );
      const firebaseUser = userCredential.user;

      // Create user profile in Firestore
      const userProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: selectedRole,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        emailVerified: false,
        approvalStatus: "approved", // Auto-approved since admin is adding them
        addedByAdmin: true,
        temporaryPassword: tempPassword,
        createdAt: serverTimestamp(),
        ...(selectedRole === "vendor" && {
          businessName: formData.businessName.trim(),
          businessCategory: formData.businessCategory.trim() || "General",
        }),
        ...(selectedRole === "driver" && {
          vehicleInfo: formData.vehicleInfo.trim(),
        }),
      };

      await setDoc(doc(db, "users", firebaseUser.uid), userProfile);

      // Send verification email
      await sendEmailVerification(firebaseUser);

      Alert.alert(
        "User Added Successfully",
        `${selectedRole === "driver" ? "Driver" : "Vendor"} has been added successfully.\n\nTemporary Password: ${tempPassword}\n\nPlease share these credentials with the user. They will need to verify their email before they can login.`,
        [
          {
            text: "OK",
            onPress: () => {
              handleClose();
              onSuccess();
            },
          },
        ],
      );
    } catch (error: any) {
      console.error("Error adding user:", error);
      Alert.alert(
        "Error",
        error.message === "Firebase: Error (auth/email-already-in-use)."
          ? "A user with this email already exists"
          : "Failed to add user. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const RoleSelector = () => (
    <View style={{ marginBottom: 20 }}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: "#374151",
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
            backgroundColor: selectedRole === "driver" ? "#3b82f6" : "#f3f4f6",
            borderRadius: 8,
            padding: 12,
            alignItems: "center",
            borderWidth: 1,
            borderColor: selectedRole === "driver" ? "#3b82f6" : "#e5e7eb",
          }}
        >
          <Ionicons
            name="car-outline"
            size={24}
            color={selectedRole === "driver" ? "white" : "#6b7280"}
          />
          <Text
            style={{
              color: selectedRole === "driver" ? "white" : "#6b7280",
              fontWeight: "600",
              marginTop: 4,
            }}
          >
            Driver
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedRole("vendor")}
          style={{
            flex: 1,
            backgroundColor: selectedRole === "vendor" ? "#059669" : "#f3f4f6",
            borderRadius: 8,
            padding: 12,
            alignItems: "center",
            borderWidth: 1,
            borderColor: selectedRole === "vendor" ? "#059669" : "#e5e7eb",
          }}
        >
          <Ionicons
            name="storefront-outline"
            size={24}
            color={selectedRole === "vendor" ? "white" : "#6b7280"}
          />
          <Text
            style={{
              color: selectedRole === "vendor" ? "white" : "#6b7280",
              fontWeight: "600",
              marginTop: 4,
            }}
          >
            Vendor
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
    multiline = false,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    keyboardType?: "default" | "email-address" | "phone-pad";
    multiline?: boolean;
  }) => (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: "#374151",
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: "#d1d5db",
          borderRadius: 8,
          padding: 12,
          fontSize: 16,
          backgroundColor: "white",
          minHeight: multiline ? 80 : 44,
          textAlignVertical: multiline ? "top" : "center",
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: "#e5e7eb",
                }}
              >
                <TouchableOpacity onPress={handleClose}>
                  <Text style={{ fontSize: 16, color: "#6b7280" }}>Cancel</Text>
                </TouchableOpacity>
                <Text
                  style={{ fontSize: 18, fontWeight: "bold", color: "#1f2937" }}
                >
                  Add New User
                </Text>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading}
                  style={{
                    backgroundColor: loading ? "#9ca3af" : "#3b82f6",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 6,
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

              {/* Form */}
              <ScrollView
                style={{ flex: 1, padding: 20 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <RoleSelector />

                <InputField
                  label="Full Name *"
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, name: text }))
                  }
                  placeholder="Enter user's full name"
                />

                <InputField
                  label="Email Address *"
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, email: text }))
                  }
                  placeholder="Enter user's email address"
                  keyboardType="email-address"
                />

                <InputField
                  label="Phone Number *"
                  value={formData.phone}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, phone: text }))
                  }
                  placeholder="Enter user's phone number"
                  keyboardType="phone-pad"
                />

                {selectedRole === "vendor" && (
                  <>
                    <InputField
                      label="Business Name *"
                      value={formData.businessName}
                      onChangeText={(text) =>
                        setFormData((prev) => ({ ...prev, businessName: text }))
                      }
                      placeholder="Enter business name"
                    />

                    <InputField
                      label="Business Category"
                      value={formData.businessCategory}
                      onChangeText={(text) =>
                        setFormData((prev) => ({
                          ...prev,
                          businessCategory: text,
                        }))
                      }
                      placeholder="e.g., Restaurant, Bar, Hotel"
                    />
                  </>
                )}

                {selectedRole === "driver" && (
                  <InputField
                    label="Vehicle Information *"
                    value={formData.vehicleInfo}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, vehicleInfo: text }))
                    }
                    placeholder="e.g., White Toyota Camry - License ABC123"
                    multiline
                  />
                )}

                <View
                  style={{
                    backgroundColor: "#f0f9ff",
                    borderRadius: 8,
                    padding: 16,
                    marginTop: 20,
                    marginBottom: 40,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#1e40af",
                      fontWeight: "600",
                      marginBottom: 8,
                    }}
                  >
                    📋 How it works:
                  </Text>
                  <Text
                    style={{ fontSize: 13, color: "#1e40af", lineHeight: 18 }}
                  >
                    • A temporary password will be generated automatically{"\n"}
                    • The user will be auto-approved (no manual approval needed)
                    {"\n"}• They must verify their email before they can login
                    {"\n"}• Share the credentials with the user after creation
                  </Text>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};
