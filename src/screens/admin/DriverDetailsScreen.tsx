import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useNotification } from "../../contexts/NotificationContext";

interface Driver {
  id: string;
  name: string;
  email: string;
  phone?: string;
  vehicleInfo?: string;
  approvalStatus: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: any;
}

export const DriverDetailsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { showNotification } = useNotification();
  const driver = (route.params as any)?.driver as Driver;

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  if (!driver) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Text>Driver not found</Text>
      </SafeAreaView>
    );
  }

  const handleApproveDriver = async () => {
    Alert.alert(
      "Approve Driver",
      `Are you sure you want to approve ${driver.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          style: "default",
          onPress: async () => {
            setProcessing(true);
            try {
              await updateDoc(doc(db, "users", driver.id), {
                approvalStatus: "approved",
                approvedAt: new Date(),
                rejectionReason: null,
              });

              showNotification({
                type: "success",
                title: "Driver Approved",
                message: `${driver.name} has been approved successfully`,
              });

              navigation.goBack();
            } catch (error) {
              console.error("Error approving driver:", error);
              showNotification({
                type: "error",
                title: "Error",
                message: "Failed to approve driver",
              });
            } finally {
              setProcessing(false);
            }
          },
        },
      ],
    );
  };

  const handleRejectDriver = () => {
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const confirmRejectDriver = async () => {
    if (!rejectionReason.trim()) {
      showNotification({
        type: "error",
        title: "Error",
        message: "Please provide a reason for rejection",
      });
      return;
    }

    setProcessing(true);
    try {
      await updateDoc(doc(db, "users", driver.id), {
        approvalStatus: "rejected",
        rejectionReason: rejectionReason.trim(),
        rejectedAt: new Date(),
      });

      showNotification({
        type: "success",
        title: "Driver Rejected",
        message: `${driver.name} has been rejected`,
      });

      setShowRejectModal(false);
      navigation.goBack();
    } catch (error) {
      console.error("Error rejecting driver:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to reject driver",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCallDriver = () => {
    if (driver.phone) {
      Linking.openURL(`tel:${driver.phone}`);
    }
  };

  const handleEmailDriver = () => {
    Linking.openURL(`mailto:${driver.email}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#f59e0b";
      case "approved":
        return "#22c55e";
      case "rejected":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: getStatusColor(status) + "20",
        alignSelf: "center",
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: getStatusColor(status),
          textTransform: "uppercase",
        }}
      >
        {status}
      </Text>
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
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>
              Driver Details
            </Text>
            <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
              {driver.name}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1, padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Driver Profile Card */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: 24,
            marginBottom: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <View
              style={{
                width: 80,
                height: 80,
                backgroundColor: getStatusColor(driver.approvalStatus) + "20",
                borderRadius: 40,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Ionicons
                name="person-outline"
                size={40}
                color={getStatusColor(driver.approvalStatus)}
              />
            </View>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: 8,
              }}
            >
              {driver.name}
            </Text>
            <StatusBadge status={driver.approvalStatus} />
          </View>

          {/* Contact Actions */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
            <TouchableOpacity
              onPress={handleEmailDriver}
              style={{
                flex: 1,
                backgroundColor: "#f3f4f6",
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color="#374151"
                style={{ marginRight: 8 }}
              />
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "#374151" }}
              >
                Email
              </Text>
            </TouchableOpacity>

            {driver.phone && (
              <TouchableOpacity
                onPress={handleCallDriver}
                style={{
                  flex: 1,
                  backgroundColor: "#f3f4f6",
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="call-outline"
                  size={20}
                  color="#374151"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: "#374151" }}
                >
                  Call
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Driver Information */}
          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                EMAIL ADDRESS
              </Text>
              <Text
                style={{ fontSize: 16, color: "#1f2937", fontWeight: "500" }}
              >
                {driver.email}
              </Text>
            </View>

            {driver.phone && (
              <View>
                <Text
                  style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}
                >
                  PHONE NUMBER
                </Text>
                <Text
                  style={{ fontSize: 16, color: "#1f2937", fontWeight: "500" }}
                >
                  {driver.phone}
                </Text>
              </View>
            )}

            {driver.licenseNumber && (
              <View>
                <Text
                  style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}
                >
                  DRIVER'S LICENSE NUMBER
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#1f2937",
                      fontWeight: "500",
                    }}
                  >
                    {driver.licenseNumber}
                  </Text>
                  <View
                    style={{
                      backgroundColor: "#fef3c7",
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 8,
                      marginLeft: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        color: "#92400e",
                        fontWeight: "600",
                      }}
                    >
                      ADMIN ONLY
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View>
              <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                APPLICATION DATE
              </Text>
              <Text
                style={{ fontSize: 16, color: "#1f2937", fontWeight: "500" }}
              >
                {(() => {
                  try {
                    if (driver.createdAt?.toDate) {
                      return new Date(
                        driver.createdAt.toDate(),
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      });
                    } else if (driver.createdAt) {
                      return new Date(driver.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      );
                    }
                    return "Unknown";
                  } catch (error) {
                    return "Unknown";
                  }
                })()}
              </Text>
            </View>
          </View>
        </View>

        {/* Vehicle Information */}
        {driver.vehicleInfo && (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Ionicons
                name="car-outline"
                size={24}
                color="#6366f1"
                style={{ marginRight: 12 }}
              />
              <Text
                style={{ fontSize: 18, fontWeight: "bold", color: "#1f2937" }}
              >
                Vehicle Information
              </Text>
            </View>
            <Text style={{ fontSize: 16, color: "#374151", lineHeight: 24 }}>
              {driver.vehicleInfo}
            </Text>
          </View>
        )}

        {/* Rejection Reason */}
        {driver.rejectionReason && (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: "#fecaca",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Ionicons
                name="warning-outline"
                size={24}
                color="#dc2626"
                style={{ marginRight: 12 }}
              />
              <Text
                style={{ fontSize: 18, fontWeight: "bold", color: "#dc2626" }}
              >
                Rejection Reason
              </Text>
            </View>
            <Text style={{ fontSize: 16, color: "#374151", lineHeight: 24 }}>
              {driver.rejectionReason}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        {driver.approvalStatus === "pending" && (
          <View style={{ gap: 12, marginBottom: 20 }}>
            <TouchableOpacity
              onPress={handleApproveDriver}
              disabled={processing}
              style={{
                backgroundColor: "#22c55e",
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                opacity: processing ? 0.5 : 1,
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "bold", color: "white" }}
              >
                {processing ? "Processing..." : "Approve Driver"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRejectDriver}
              disabled={processing}
              style={{
                backgroundColor: "#ef4444",
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                opacity: processing ? 0.5 : 1,
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "bold", color: "white" }}
              >
                Reject Driver
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Rejection Modal */}
      <Modal visible={showRejectModal} animationType="slide" transparent>
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
                Reject Driver
              </Text>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 16, color: "#374151", marginBottom: 16 }}>
              Please provide a detailed reason for rejecting {driver.name}:
            </Text>

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                minHeight: 120,
                textAlignVertical: "top",
                marginBottom: 20,
              }}
              placeholder="Enter rejection reason (e.g., incomplete vehicle information, missing requirements, etc.)"
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
            />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowRejectModal(false)}
                style={{
                  flex: 1,
                  backgroundColor: "#f3f4f6",
                  borderRadius: 8,
                  padding: 16,
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
                onPress={confirmRejectDriver}
                disabled={!rejectionReason.trim() || processing}
                style={{
                  flex: 1,
                  backgroundColor: "#ef4444",
                  borderRadius: 8,
                  padding: 16,
                  alignItems: "center",
                  opacity: !rejectionReason.trim() || processing ? 0.5 : 1,
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "white" }}
                >
                  {processing ? "Rejecting..." : "Reject Driver"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
