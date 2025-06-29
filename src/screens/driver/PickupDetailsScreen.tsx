import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useUnifiedAuth } from "../../hooks/useUnifiedAuth";
import { useFirebasePickupStore } from "../../contexts/FirebasePickupStore";
import { NavigationUtils } from "../../utils/navigationUtils";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
export const PickupDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const routePickup = (route.params as any)?.pickup;
  const { user } = useUnifiedAuth();
  const { updatePickup } = useFirebasePickupStore();

  const [pickup, setPickup] = useState(routePickup);
  const [loading, setLoading] = useState(false);

  // Real-time pickup data listener
  useEffect(() => {
    if (!routePickup?.id) return;

    setLoading(true);
    const unsubscribe = onSnapshot(
      doc(db, "pickups", routePickup.id),
      (doc) => {
        if (doc.exists()) {
          const updatedPickup = { id: doc.id, ...doc.data() };
          setPickup(updatedPickup);

          // Check if this pickup is no longer assigned to current driver
          if (updatedPickup.driverId !== user?.uid) {
            Alert.alert(
              "Pickup No Longer Assigned",
              "This pickup is no longer assigned to you.",
              [
                {
                  text: "OK",
                  onPress: () => navigation.navigate("MyPickupsTab" as never),
                },
              ],
            );
            return;
          }
        } else {
          // Pickup was deleted
          Alert.alert("Pickup Not Found", "This pickup no longer exists.", [
            {
              text: "OK",
              onPress: () => navigation.navigate("MyPickupsTab" as never),
            },
          ]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to pickup:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [routePickup?.id, user?.uid, navigation]);

  // Check if pickup can be completed (only on or after pickup date)
  const canCompletePickup = () => {
    if (!pickup?.scheduledDate) return false;

    const pickupDate = new Date(pickup.scheduledDate);
    const now = new Date();

    // Allow completion from the pickup date onwards
    const pickupDateOnly = new Date(
      pickupDate.getFullYear(),
      pickupDate.getMonth(),
      pickupDate.getDate(),
    );
    const todayOnly = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    return todayOnly >= pickupDateOnly;
  };

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
        <Text style={{ fontSize: 18, color: "#6b7280" }}>Pickup not found</Text>
      </SafeAreaView>
    );
  }

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

  const formatDate = (dateValue: any) => {
    try {
      let date;

      // Handle Firebase Timestamp
      if (dateValue && typeof dateValue.toDate === "function") {
        date = dateValue.toDate();
      }
      // Handle regular date string or Date object
      else if (dateValue) {
        date = new Date(dateValue);
      } else {
        return "Date not available";
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const formatTime = (dateValue: any) => {
    try {
      let date;

      // Handle Firebase Timestamp
      if (dateValue && typeof dateValue.toDate === "function") {
        date = dateValue.toDate();
      }
      // Handle regular date string or Date object
      else if (dateValue) {
        date = new Date(dateValue);
      } else {
        return "Time not available";
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid time";
      }

      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid time";
    }
  };

  const handleStartPickup = async () => {
    try {
      await updatePickup(pickup.id, {
        status: "in-progress",
      });
      Alert.alert("Pickup Started", "The pickup is now in progress.");
    } catch (error) {
      Alert.alert("Error", "Failed to start pickup. Please try again.");
    }
  };

  const handleCallVendor = () => {
    if (pickup.contactPhone) {
      Linking.openURL(`tel:${pickup.contactPhone}`);
    } else {
      Alert.alert(
        "No Phone Number",
        "No contact phone number available for this vendor.",
      );
    }
  };

  const handleGetDirections = () => {
    if (pickup.address) {
      const encodedAddress = encodeURIComponent(pickup.address);
      const url = `https://maps.apple.com/?q=${encodedAddress}`;
      Linking.openURL(url);
    } else {
      Alert.alert("No Address", "No address available for this pickup.");
    }
  };

  const DetailSection: React.FC<{
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

  const InfoRow: React.FC<{
    icon: string;
    label: string;
    value: string;
    color?: string;
  }> = ({ icon, label, value, color = "#1f2937" }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          backgroundColor: "#f3f4f6",
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Ionicons name={icon as any} size={20} color="#6b7280" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 2 }}>
          {label}
        </Text>
        <Text style={{ fontSize: 16, fontWeight: "600", color }}>{value}</Text>
      </View>
    </View>
  );

  const StatusBadge = () => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: getStatusColor(pickup.status) + "20",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        alignSelf: "flex-start",
      }}
    >
      <Ionicons
        name={getStatusIcon(pickup.status) as any}
        size={16}
        color={getStatusColor(pickup.status)}
        style={{ marginRight: 6 }}
      />
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: getStatusColor(pickup.status),
        }}
      >
        {pickup.status.charAt(0).toUpperCase() +
          pickup.status.slice(1).replace("-", " ")}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <LinearGradient
        colors={["#4facfe", "#00f2fe"]}
        style={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 30,
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
            style={{
              width: 40,
              height: 40,
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
            }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>
              Pickup Details
            </Text>
            <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
              ID: {pickup.id.slice(-8)}
            </Text>
          </View>
          <StatusBadge />
        </View>

        {/* Quick Info */}
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: "white",
              marginBottom: 8,
            }}
          >
            {pickup.bottleCount} Bottles
          </Text>
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.9)" }}>
            Scheduled: {formatDate(pickup.scheduledDate)} at{" "}
            {formatTime(pickup.scheduledDate)}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 20 }}>
          {/* Schedule Information */}
          <DetailSection title="Schedule Information">
            <InfoRow
              icon="calendar-outline"
              label="Pickup Date"
              value={formatDate(pickup.scheduledDate)}
            />
            <InfoRow
              icon="time-outline"
              label="Pickup Time"
              value={formatTime(pickup.scheduledDate)}
            />
            <InfoRow
              icon="wine-outline"
              label="Expected Bottles"
              value={`${pickup.bottleCount} bottles`}
            />
            {pickup.urgentPickup && (
              <InfoRow
                icon="flash-outline"
                label="Priority"
                value="Urgent Pickup"
                color="#f59e0b"
              />
            )}
          </DetailSection>

          {/* Location Information */}
          {pickup.address && (
            <DetailSection title="Location">
              <InfoRow
                icon="location-outline"
                label="Pickup Address"
                value={pickup.address}
              />
            </DetailSection>
          )}

          {/* Contact Information */}
          {pickup.contactPhone && (
            <DetailSection title="Contact">
              <InfoRow
                icon="call-outline"
                label="Vendor Phone"
                value={pickup.contactPhone}
              />
            </DetailSection>
          )}

          {/* Additional Notes */}
          {pickup.notes && (
            <DetailSection title="Notes">
              <Text style={{ fontSize: 16, color: "#1f2937", lineHeight: 24 }}>
                {pickup.notes}
              </Text>
            </DetailSection>
          )}

          {/* Timestamps */}
          <DetailSection title="Timeline">
            <InfoRow
              icon="add-circle-outline"
              label="Created"
              value={
                formatDate(pickup.createdAt) +
                " at " +
                formatTime(pickup.createdAt)
              }
            />
            {pickup.completedAt && (
              <InfoRow
                icon="checkmark-circle-outline"
                label="Completed"
                value={
                  formatDate(pickup.completedAt) +
                  " at " +
                  formatTime(pickup.completedAt)
                }
              />
            )}
          </DetailSection>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {(pickup.status === "assigned" || pickup.status === "in-progress") && (
        <View
          style={{
            padding: 20,
            backgroundColor: "white",
            borderTopWidth: 1,
            borderTopColor: "#e5e7eb",
          }}
        >
          {/* Quick Actions */}
          <View style={{ flexDirection: "row", marginBottom: 16, gap: 12 }}>
            {pickup.contactPhone && (
              <TouchableOpacity
                onPress={handleCallVendor}
                style={{
                  flex: 1,
                  backgroundColor: "#22c55e",
                  borderRadius: 12,
                  paddingVertical: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="call"
                  size={20}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "white" }}
                >
                  Call
                </Text>
              </TouchableOpacity>
            )}
            {pickup.address && (
              <TouchableOpacity
                onPress={() =>
                  NavigationUtils.openNavigation({
                    address: pickup.address || pickup.vendorAddress || "",
                    label: pickup.vendorName,
                  })
                }
                style={{
                  backgroundColor: "#3b82f6",
                  borderRadius: 12,
                  paddingVertical: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="navigate"
                  size={20}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "white" }}
                >
                  Directions
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Main Actions */}
          <View style={{ gap: 12 }}>
            {pickup.status === "assigned" && (
              <>
                {/* Date Warning */}
                {!canCompletePickup() && (
                  <View
                    style={{
                      backgroundColor: "#fef3c7",
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: "#fbbf24",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color="#92400e"
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: "#92400e",
                        }}
                      >
                        Complete on pickup date
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: "#92400e" }}>
                      Available: {formatDate(pickup.scheduledDate)} at{" "}
                      {formatTime(pickup.scheduledDate)}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate(
                      "CompletePickupWithProof" as never,
                      { pickup } as never,
                    )
                  }
                  disabled={!canCompletePickup()}
                  style={{
                    backgroundColor: canCompletePickup()
                      ? "#22c55e"
                      : "#9ca3af",
                    borderRadius: 16,
                    paddingVertical: 16,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ fontSize: 18, fontWeight: "bold", color: "white" }}
                  >
                    {canCompletePickup()
                      ? "Complete Pickup"
                      : "Complete on Pickup Date"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate(
                      "CancelPickup" as never,
                      { pickup } as never,
                    )
                  }
                  style={{
                    backgroundColor: "#ef4444",
                    borderRadius: 16,
                    paddingVertical: 16,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ fontSize: 18, fontWeight: "bold", color: "white" }}
                  >
                    Cancel Pickup
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};
