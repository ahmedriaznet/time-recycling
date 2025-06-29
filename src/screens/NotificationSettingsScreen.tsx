import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { useUnifiedAuth } from "../hooks/useUnifiedAuth";
import { PushNotificationService } from "../utils/pushNotificationService";
import { PickupReminderScheduler } from "../utils/pickupReminderScheduler";
import { useNotification } from "../contexts/NotificationContext";

export const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useUnifiedAuth();
  const { showNotification } = useNotification();

  const [pushEnabled, setPushEnabled] = useState(false);
  const [pickupReminders, setPickupReminders] = useState(true);
  const [pickupUpdates, setPickupUpdates] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPushEnabled(status === "granted");
    } catch (error) {
      console.error("Error checking notification status:", error);
    }
  };

  const handlePushToggle = async (enabled: boolean) => {
    try {
      setLoading(true);

      if (enabled) {
        // Request permission and register
        const token =
          await PushNotificationService.registerForPushNotifications(
            user?.uid || "",
            user?.role as any,
          );

        if (token) {
          setPushEnabled(true);
          showNotification({
            type: "success",
            title: "Notifications Enabled",
            message:
              "You'll now receive push notifications for important updates.",
          });
        } else {
          Alert.alert(
            "Permission Required",
            "Please enable notifications in your device settings to receive pickup updates.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => Notifications.openSettingsAsync(),
              },
            ],
          );
        }
      } else {
        // Disable notifications (user can do this in device settings)
        Alert.alert(
          "Disable Notifications",
          "To disable notifications, please go to your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => Notifications.openSettingsAsync(),
            },
          ],
        );
      }
    } catch (error) {
      console.error("Error toggling push notifications:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to update notification settings.",
      });
    } finally {
      setLoading(false);
    }
  };

  const testNotification = async () => {
    try {
      if (!pushEnabled) {
        Alert.alert(
          "Notifications Disabled",
          "Please enable notifications first.",
        );
        return;
      }

      // Send test notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🧪 Test Notification",
          body: "Your notifications are working correctly!",
          data: { test: true },
        },
        trigger: { seconds: 1 },
      });

      showNotification({
        type: "success",
        title: "Test Sent",
        message: "Check your notifications in a moment!",
      });
    } catch (error) {
      console.error("Error sending test notification:", error);
      showNotification({
        type: "error",
        title: "Test Failed",
        message: "Could not send test notification.",
      });
    }
  };

  const triggerPickupReminders = async () => {
    try {
      await PickupReminderScheduler.triggerRemindersNow();
      showNotification({
        type: "success",
        title: "Reminders Sent",
        message: "Pickup reminders have been triggered for testing.",
      });
    } catch (error) {
      console.error("Error triggering reminders:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to trigger pickup reminders.",
      });
    }
  };

  const SettingRow: React.FC<{
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    value: boolean;
    onToggle: (value: boolean) => void;
    disabled?: boolean;
  }> = ({ icon, title, subtitle, value, onToggle, disabled = false }) => (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        opacity: disabled ? 0.5 : 1,
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
          backgroundColor: "#3b82f620",
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 16,
        }}
      >
        <Ionicons name={icon} size={20} color="#3b82f6" />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: "#1f2937",
            marginBottom: 2,
          }}
        >
          {title}
        </Text>
        <Text style={{ fontSize: 14, color: "#6b7280" }}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled || loading}
        trackColor={{ false: "#f3f4f6", true: "#3b82f6" }}
        thumbColor={value ? "#ffffff" : "#d1d5db"}
      />
    </View>
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
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginRight: 16 }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View
            style={{
              width: 50,
              height: 50,
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 25,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
            }}
          >
            <Ionicons name="notifications" size={24} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>
              Notifications
            </Text>
            <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
              Manage your notification preferences
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1, padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Push Notifications */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            color: "#1f2937",
            marginBottom: 16,
          }}
        >
          Push Notifications
        </Text>

        <SettingRow
          icon="notifications-outline"
          title="Push Notifications"
          subtitle="Receive notifications on your device"
          value={pushEnabled}
          onToggle={handlePushToggle}
        />

        {/* Notification Types */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            color: "#1f2937",
            marginTop: 24,
            marginBottom: 16,
          }}
        >
          Notification Types
        </Text>

        {user?.role === "vendor" && (
          <SettingRow
            icon="checkmark-circle-outline"
            title="Pickup Updates"
            subtitle="When drivers accept, complete, or cancel your pickups"
            value={pickupUpdates}
            onToggle={setPickupUpdates}
            disabled={!pushEnabled}
          />
        )}

        {user?.role === "driver" && (
          <SettingRow
            icon="calendar-outline"
            title="Pickup Reminders"
            subtitle="Daily reminders for tomorrow's pickups"
            value={pickupReminders}
            onToggle={setPickupReminders}
            disabled={!pushEnabled}
          />
        )}

        {/* Test Section */}
        {__DEV__ && (
          <>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: "#1f2937",
                marginTop: 24,
                marginBottom: 16,
              }}
            >
              Testing (Development Only)
            </Text>

            <TouchableOpacity
              onPress={testNotification}
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
                  backgroundColor: "#22c55e20",
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <Ionicons name="flash-outline" size={20} color="#22c55e" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#1f2937" }}
                >
                  Send Test Notification
                </Text>
                <Text style={{ fontSize: 14, color: "#6b7280" }}>
                  Test if notifications are working
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            {user?.role === "driver" && (
              <TouchableOpacity
                onPress={triggerPickupReminders}
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
                    backgroundColor: "#f59e0b20",
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 16,
                  }}
                >
                  <Ionicons name="alarm-outline" size={20} color="#f59e0b" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#1f2937",
                    }}
                  >
                    Test Pickup Reminders
                  </Text>
                  <Text style={{ fontSize: 14, color: "#6b7280" }}>
                    Trigger pickup reminder check now
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Info */}
        <View
          style={{
            backgroundColor: "#eff6ff",
            borderRadius: 12,
            padding: 16,
            marginTop: 24,
            borderWidth: 1,
            borderColor: "#bfdbfe",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#3b82f6"
            />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#1f2937",
                marginLeft: 8,
              }}
            >
              About Notifications
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: "#374151", lineHeight: 20 }}>
            {user?.role === "vendor"
              ? "You'll receive notifications when drivers accept, complete, or cancel your pickups."
              : user?.role === "driver"
                ? "You'll receive daily reminders at 8 PM for pickups scheduled the next day."
                : "Notifications help you stay updated with important pickup activities."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
