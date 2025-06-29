import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useUnifiedAuth } from "../../hooks/useUnifiedAuth";
import { useNotification } from "../../contexts/NotificationContext";
import {
  EditEmailModal,
  EditPhoneModal,
  EditPasswordModal,
  EditNameModal,
} from "../../components/EditProfileModals";

export const AdminProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, signOut } = useUnifiedAuth();
  const { showNotification } = useNotification();

  // Edit modal states
  const [showEditName, setShowEditName] = useState(false);
  const [showEditEmail, setShowEditEmail] = useState(false);
  const [showEditPhone, setShowEditPhone] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            showNotification({
              type: "success",
              title: "Signed Out",
              message: "You have been successfully signed out",
            });
          } catch (error) {
            console.error("Error signing out:", error);
            showNotification({
              type: "error",
              title: "Error",
              message: "Failed to sign out",
            });
          }
        },
      },
    ]);
  };

  const ProfileItem: React.FC<{
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    value: string;
    onPress?: () => void;
  }> = ({ icon, title, value, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          backgroundColor: "#6366f120",
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 16,
        }}
      >
        <Ionicons name={icon} size={20} color="#6366f1" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 2 }}>
          {title}
        </Text>
        <Text style={{ fontSize: 16, color: "#1f2937", fontWeight: "500" }}>
          {value}
        </Text>
      </View>
      {onPress && <Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
    </TouchableOpacity>
  );

  const ActionItem: React.FC<{
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    color?: string;
    onPress: () => void;
  }> = ({ icon, title, subtitle, color = "#374151", onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          backgroundColor: color + "20",
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 16,
        }}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontSize: 16, color, fontWeight: "500", marginBottom: 2 }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 14, color: "#6b7280" }}>{subtitle}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <LinearGradient
        colors={["#6366f1", "#8b5cf6"]}
        style={{
          paddingHorizontal: 20,
          paddingVertical: 30,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <View style={{ alignItems: "center" }}>
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
            <Ionicons name="shield-checkmark" size={40} color="white" />
          </View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "white",
              marginBottom: 4,
            }}
          >
            {user?.name}
          </Text>
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
            }}
          >
            <Text style={{ fontSize: 14, color: "white", fontWeight: "600" }}>
              ADMINISTRATOR
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1, padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Information */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: 16,
            }}
          >
            Account Information
          </Text>

          <ProfileItem
            icon="person-outline"
            title="Full Name"
            value={user?.name || "Not set"}
            onPress={() => setShowEditName(true)}
          />

          <ProfileItem
            icon="mail-outline"
            title="Email Address"
            value={user?.email || "Not set"}
            onPress={() => setShowEditEmail(true)}
          />

          <ProfileItem
            icon="phone-portrait-outline"
            title="Phone Number"
            value={user?.phone || "Not set"}
            onPress={() => setShowEditPhone(true)}
          />

          <ProfileItem
            icon="calendar-outline"
            title="Member Since"
            value={(() => {
              try {
                if (user?.createdAt?.toDate) {
                  return user.createdAt.toDate().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  });
                } else if (user?.createdAt) {
                  return new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  });
                }
                return "Unknown";
              } catch (error) {
                return "Unknown";
              }
            })()}
          />

          <ProfileItem
            icon="shield-checkmark-outline"
            title="Role"
            value="Administrator"
          />
        </View>

        {/* Admin Tools */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: 16,
            }}
          >
            Admin Tools
          </Text>

          <ActionItem
            icon="people-outline"
            title="Driver Management"
            subtitle="Approve or reject driver applications"
            color="#3b82f6"
            onPress={() =>
              navigation.navigate(
                "ApprovalManagement" as never,
                { tab: "drivers" } as never,
              )
            }
          />

          <ActionItem
            icon="storefront-outline"
            title="Vendor Management"
            subtitle="Approve or reject vendor applications"
            color="#059669"
            onPress={() =>
              navigation.navigate(
                "ApprovalManagement" as never,
                { tab: "vendors" } as never,
              )
            }
          />
        </View>

        {/* Account Actions */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: 16,
            }}
          >
            Account
          </Text>

          <ActionItem
            icon="lock-closed-outline"
            title="Change Password"
            subtitle="Update your account password"
            color="#374151"
            onPress={() => setShowEditPassword(true)}
          />
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={{
            backgroundColor: "#fef2f2",
            borderRadius: 12,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
            borderWidth: 1,
            borderColor: "#fecaca",
          }}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color="#dc2626"
            style={{ marginRight: 8 }}
          />
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#dc2626" }}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Modals */}
      <EditNameModal
        visible={showEditName}
        onClose={() => setShowEditName(false)}
        onSuccess={() => {
          Alert.alert("Success", "Name updated successfully!");
        }}
        currentName={user?.name || ""}
        userId={user?.uid || ""}
      />

      <EditEmailModal
        visible={showEditEmail}
        onClose={() => setShowEditEmail(false)}
        onSuccess={() => {
          Alert.alert("Success", "Email updated successfully!");
        }}
        currentEmail={user?.email || ""}
      />

      <EditPhoneModal
        visible={showEditPhone}
        onClose={() => setShowEditPhone(false)}
        onSuccess={() => {
          Alert.alert("Success", "Phone updated successfully!");
        }}
        currentPhone={user?.phone || ""}
        userId={user?.uid || ""}
      />

      <EditPasswordModal
        visible={showEditPassword}
        onClose={() => setShowEditPassword(false)}
        onSuccess={() => {
          Alert.alert("Success", "Password updated successfully!");
        }}
      />
    </SafeAreaView>
  );
};
