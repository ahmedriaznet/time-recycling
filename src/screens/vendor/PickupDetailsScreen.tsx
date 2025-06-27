import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

interface Pickup {
  id: string;
  vendorId: string;
  driverId?: string;
  driverName?: string;
  scheduledDate: string;
  bottleCount: number;
  actualBottleCount?: number;
  status: "pending" | "assigned" | "in-progress" | "completed" | "cancelled";
  notes?: string;
  createdAt: string;
  completedAt?: string;
  address?: string;
  contactPhone?: string;
  urgentPickup?: boolean;
  completionPhotos?: string[];
}

export const PickupDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const pickup = (route.params as any)?.pickup as Pickup;
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string>("");

  if (!pickup) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#f8fafc",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>Pickup not found</Text>
      </SafeAreaView>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#f59e0b";
      case "assigned":
        return "#3b82f6";
      case "in-progress":
        return "#8b5cf6";
      case "completed":
        return "#22c55e";
      case "cancelled":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return "time-outline";
      case "assigned":
        return "person-outline";
      case "in-progress":
        return "car-outline";
      case "completed":
        return "checkmark-circle-outline";
      case "cancelled":
        return "close-circle-outline";
      default:
        return "help-outline";
    }
  };

  const handleCancelPickup = async () => {
    try {
      await updateDoc(doc(db, "pickups", pickup.id), {
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
      });

      setShowCancelModal(false);
      Alert.alert("Cancelled", "Pickup has been cancelled successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Error cancelling pickup:", error);
      Alert.alert("Error", "Failed to cancel pickup");
    }
  };

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
    <View
      style={[
        {
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: getStatusColor(status) + "20",
          flexDirection: "row",
          alignItems: "center",
        },
      ]}
    >
      <Ionicons
        name={getStatusIcon(status) as any}
        size={16}
        color={getStatusColor(status)}
        style={{ marginRight: 6 }}
      />
      <Text
        style={[
          { fontSize: 14, fontWeight: "600", color: getStatusColor(status) },
        ]}
      >
        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
      </Text>
    </View>
  );

  const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({
    title,
    children,
  }) => (
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

  const InfoRow: React.FC<{
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    color?: string;
  }> = ({ icon, label, value, color = "#1f2937" }) => (
    <View
      style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
    >
      <Ionicons
        name={icon}
        size={20}
        color="#6b7280"
        style={{ marginRight: 12, width: 24 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 2 }}>
          {label}
        </Text>
        <Text style={{ fontSize: 16, fontWeight: "600", color }}>{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
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
              <Text
                style={{ fontSize: 24, fontWeight: "bold", color: "white" }}
              >
                Pickup Details
              </Text>
              <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
                Request #{pickup.id.slice(-6).toUpperCase()}
              </Text>
            </View>
            <StatusBadge status={pickup.status} />
          </View>

          {/* Quick Info */}
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View>
                <Text
                  style={{ fontSize: 20, fontWeight: "bold", color: "white" }}
                >
                  {pickup.actualBottleCount || pickup.bottleCount} bottles
                </Text>
                <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
                  {pickup.urgentPickup ? "Urgent pickup" : "Standard pickup"}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text
                  style={{ fontSize: 16, fontWeight: "bold", color: "white" }}
                >
                  {formatDate(pickup.scheduledDate)}
                </Text>
                <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
                  {formatTime(pickup.scheduledDate)}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={{ padding: 20 }}>
          {/* Pickup Information */}
          <InfoCard title="Pickup Information">
            <InfoRow
              icon="wine-outline"
              label="Bottles Requested"
              value={pickup.bottleCount.toString()}
            />
            {pickup.actualBottleCount &&
              pickup.actualBottleCount !== pickup.bottleCount && (
                <InfoRow
                  icon="checkmark-circle-outline"
                  label="Bottles Collected"
                  value={pickup.actualBottleCount.toString()}
                  color="#22c55e"
                />
              )}
            <InfoRow
              icon="calendar-outline"
              label="Scheduled Date"
              value={`${formatDate(pickup.scheduledDate)} at ${formatTime(pickup.scheduledDate)}`}
            />
            <InfoRow
              icon="location-outline"
              label="Pickup Address"
              value={pickup.address || "Not specified"}
            />
            {pickup.contactPhone && (
              <InfoRow
                icon="call-outline"
                label="Contact Phone"
                value={pickup.contactPhone}
              />
            )}
            <InfoRow
              icon="flash-outline"
              label="Priority"
              value={pickup.urgentPickup ? "Urgent (+$5)" : "Standard (Free)"}
              color={pickup.urgentPickup ? "#f59e0b" : "#22c55e"}
            />
          </InfoCard>

          {/* Driver Information */}
          {pickup.driverName && (
            <InfoCard title="Driver Information">
              <InfoRow
                icon="person-outline"
                label="Driver Name"
                value={pickup.driverName}
              />
              <InfoRow
                icon="car-outline"
                label="Status"
                value={
                  pickup.status === "assigned"
                    ? "Assigned"
                    : pickup.status === "in-progress"
                      ? "On the way"
                      : "Completed"
                }
              />
            </InfoCard>
          )}

          {/* Notes */}
          {pickup.notes && (
            <InfoCard title="Special Instructions">
              <Text style={{ fontSize: 16, color: "#374151", lineHeight: 24 }}>
                {pickup.notes}
              </Text>
            </InfoCard>
          )}

          {/* Completion Photos */}
          {pickup.completionPhotos && pickup.completionPhotos.length > 0 && (
            <InfoCard title="Completion Photos">
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {pickup.completionPhotos.map((photo, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setSelectedPhoto(photo);
                      setShowPhotoModal(true);
                    }}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 8,
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      source={{ uri: photo }}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </InfoCard>
          )}

          {/* Timeline */}
          <InfoCard title="Timeline">
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#22c55e",
                    marginRight: 12,
                  }}
                />
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#1f2937",
                    }}
                  >
                    Pickup Requested
                  </Text>
                  <Text style={{ fontSize: 12, color: "#6b7280" }}>
                    {formatDate(pickup.createdAt)}
                  </Text>
                </View>
              </View>

              {pickup.status !== "pending" && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#3b82f6",
                      marginRight: 12,
                    }}
                  />
                  <View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#1f2937",
                      }}
                    >
                      Driver Assigned
                    </Text>
                    <Text style={{ fontSize: 12, color: "#6b7280" }}>
                      Driver: {pickup.driverName}
                    </Text>
                  </View>
                </View>
              )}

              {pickup.status === "completed" && pickup.completedAt && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#22c55e",
                      marginRight: 12,
                    }}
                  />
                  <View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#1f2937",
                      }}
                    >
                      Pickup Completed
                    </Text>
                    <Text style={{ fontSize: 12, color: "#6b7280" }}>
                      {formatDate(pickup.completedAt)}
                    </Text>
                  </View>
                </View>
              )}

              {pickup.status === "cancelled" && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#ef4444",
                      marginRight: 12,
                    }}
                  />
                  <View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#1f2937",
                      }}
                    >
                      Pickup Cancelled
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </InfoCard>

          {/* Actions */}
          {pickup.status === "pending" && (
            <View style={{ gap: 12, marginBottom: 20 }}>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    "Edit Pickup",
                    "Edit pickup functionality coming soon",
                  )
                }
                style={{
                  backgroundColor: "#3b82f6",
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "white" }}
                >
                  Edit Pickup
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowCancelModal(true)}
                style={{
                  backgroundColor: "#fef2f2",
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="close-outline"
                  size={20}
                  color="#dc2626"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#dc2626" }}
                >
                  Cancel Pickup
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Cancel Confirmation Modal */}
      <Modal visible={showCancelModal} transparent animationType="fade">
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
              borderRadius: 16,
              padding: 24,
              width: "100%",
              maxWidth: 340,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  backgroundColor: "#fef2f2",
                  borderRadius: 32,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Ionicons name="warning-outline" size={32} color="#dc2626" />
              </View>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: "#1f2937",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Cancel Pickup?
              </Text>
              <Text
                style={{ fontSize: 16, color: "#6b7280", textAlign: "center" }}
              >
                Are you sure you want to cancel this pickup request? This action
                cannot be undone.
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowCancelModal(false)}
                style={{
                  flex: 1,
                  backgroundColor: "#f3f4f6",
                  borderRadius: 8,
                  padding: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#374151" }}
                >
                  Keep Pickup
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCancelPickup}
                style={{
                  flex: 1,
                  backgroundColor: "#dc2626",
                  borderRadius: 8,
                  padding: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "white" }}
                >
                  Cancel Pickup
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Photo Modal */}
      <Modal visible={showPhotoModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() => setShowPhotoModal(false)}
            style={{ position: "absolute", top: 60, right: 20, zIndex: 1 }}
          >
            <Ionicons name="close" size={32} color="white" />
          </TouchableOpacity>
          {selectedPhoto && (
            <Image
              source={{ uri: selectedPhoto }}
              style={{ width: "90%", height: "70%" }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};
