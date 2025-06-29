import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import EmailService from "../../services/emailService";

export const EmailTestScreen: React.FC = () => {
  const [emailLog, setEmailLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEmailLog();
  }, []);

  const loadEmailLog = async () => {
    const log = await EmailService.getEmailLog();
    setEmailLog(log);
  };

  const testNewPickupEmail = async () => {
    setLoading(true);
    try {
      const success = await EmailService.notifyDriverNewPickup(
        "test.driver@example.com",
        {
          pickupId: "TEST-001",
          vendorName: "Test Restaurant",
          address: "123 Test Street, Test City",
          bottleCount: 25,
          scheduledDate: new Date().toISOString(),
          notes: "Please ring the bell when arriving",
        },
      );

      if (success) {
        Alert.alert("Success", "Test pickup notification email sent!");
        loadEmailLog();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to send test email");
    } finally {
      setLoading(false);
    }
  };

  const testPickupAcceptedEmail = async () => {
    setLoading(true);
    try {
      const success = await EmailService.notifyVendorPickupAccepted(
        "test.vendor@example.com",
        {
          pickupId: "TEST-002",
          driverName: "John Smith",
          driverPhone: "+1 (555) 123-4567",
          scheduledDate: new Date().toISOString(),
          address: "123 Test Street, Test City",
          bottleCount: 30,
        },
      );

      if (success) {
        Alert.alert("Success", "Test pickup accepted email sent!");
        loadEmailLog();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to send test email");
    } finally {
      setLoading(false);
    }
  };

  const testNewSignupEmail = async () => {
    setLoading(true);
    try {
      const success = await EmailService.notifyAdminNewSignup({
        name: "Test Driver",
        email: "test.newdriver@example.com",
        role: "driver",
        phone: "+1 (555) 987-6543",
        vehicleInfo: JSON.stringify({
          type: "truck",
          make: "Ford",
          model: "Transit",
          year: "2020",
          licensePlate: "TEST-123",
          color: "White",
        }),
      });

      if (success) {
        Alert.alert("Success", "Test signup notification email sent!");
        loadEmailLog();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to send test email");
    } finally {
      setLoading(false);
    }
  };

  const testDriverApprovalEmail = async () => {
    setLoading(true);
    try {
      const success = await EmailService.notifyDriverApproved(
        "test.driver@example.com",
        "John Smith",
      );

      if (success) {
        Alert.alert("Success", "Test driver approval email sent!");
        loadEmailLog();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to send test email");
    } finally {
      setLoading(false);
    }
  };

  const clearEmailLog = async () => {
    Alert.alert(
      "Clear Email Log",
      "This will delete all email log entries. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await EmailService.clearEmailLog();
            setEmailLog([]);
            Alert.alert("Success", "Email log cleared");
          },
        },
      ],
    );
  };

  const TestButton: React.FC<{
    title: string;
    subtitle: string;
    icon: string;
    onPress: () => void;
    color: string;
  }> = ({ title, subtitle, icon, onPress, color }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={[styles.testButton, { borderLeftColor: color }]}
    >
      <View style={styles.testButtonContent}>
        <Ionicons name={icon as any} size={24} color={color} />
        <View style={styles.testButtonText}>
          <Text style={styles.testButtonTitle}>{title}</Text>
          <Text style={styles.testButtonSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
        <Text style={styles.headerTitle}>Email Testing & Management</Text>
        <Text style={styles.headerSubtitle}>Test email notifications</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Test Email Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📧 Test Email Notifications</Text>

          <TestButton
            title="New Pickup Available"
            subtitle="Send to driver when vendor schedules pickup"
            icon="cube-outline"
            onPress={testNewPickupEmail}
            color="#3b82f6"
          />

          <TestButton
            title="Pickup Accepted"
            subtitle="Send to vendor when driver accepts"
            icon="checkmark-circle-outline"
            onPress={testPickupAcceptedEmail}
            color="#22c55e"
          />

          <TestButton
            title="New User Signup"
            subtitle="Send to admin for approval"
            icon="person-add-outline"
            onPress={testNewSignupEmail}
            color="#f59e0b"
          />

          <TestButton
            title="Driver Approved"
            subtitle="Welcome email to approved driver"
            icon="shield-checkmark-outline"
            onPress={testDriverApprovalEmail}
            color="#8b5cf6"
          />
        </View>

        {/* Email Log */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              📮 Email Log ({emailLog.length})
            </Text>
            <TouchableOpacity
              onPress={clearEmailLog}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>

          {emailLog.length > 0 ? (
            <View style={styles.emailLog}>
              {emailLog
                .slice(-5)
                .reverse()
                .map((email, index) => (
                  <View key={email.id} style={styles.emailLogItem}>
                    <Text style={styles.emailSubject}>{email.subject}</Text>
                    <Text style={styles.emailTo}>To: {email.to}</Text>
                    <Text style={styles.emailDate}>
                      {new Date(email.sentAt).toLocaleString()}
                    </Text>
                  </View>
                ))}
            </View>
          ) : (
            <View style={styles.emptyLog}>
              <Text style={styles.emptyLogText}>No emails sent yet</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  clearButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  testButton: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  testButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  testButtonText: {
    flex: 1,
    marginLeft: 12,
  },
  testButtonTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  testButtonSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  reportButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  reportButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  reportButtonText: {
    flex: 1,
    marginLeft: 16,
  },
  reportButtonTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  reportButtonSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  historyItem: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#3b82f6",
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  historyDetails: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  historyDate: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
  },
  emailLog: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
  },
  emailLogItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  emailSubject: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  emailTo: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  emailDate: {
    fontSize: 11,
    color: "#9ca3af",
  },
  emptyLog: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  emptyLogText: {
    fontSize: 14,
    color: "#9ca3af",
  },
  bottomPadding: {
    height: 40,
  },
});
