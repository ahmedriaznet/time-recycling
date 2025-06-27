import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useUnifiedAuth } from "../../hooks/useUnifiedAuth";

import {
  useFirebasePickupStore,
  Pickup,
} from "../../contexts/FirebasePickupStore";
// Firebase imports completely removed to prevent any Firebase queries
import {
  getPickupStats,
  formatPickupDate,
  getStatusColor,
} from "../../utils/firebaseSetup";

export const VendorDashboard: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { user } = useUnifiedAuth();

  const { getPickupsForVendor, loading, error } = useFirebasePickupStore();

  // Get pickups for current vendor
  const pickups = getPickupsForVendor(user?.uid || "");

  const onRefresh = async () => {
    setRefreshing(true);

    // Simulate refresh delay for demo mode
    try {
      console.log("📱 Refreshing vendor dashboard...");
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay

      // In demo mode, we can reload the demo data or just simulate refresh
      if (user) {
        console.log("✅ Demo data refreshed for vendor");
        // Demo data is already loaded, just simulate refresh completion
      }

      console.log("✅ Vendor dashboard refreshed");
    } catch (error) {
      console.error("❌ Error refreshing vendor dashboard:", error);
    } finally {
      setRefreshing(false); // Always reset refreshing state
    }
  };

  const stats = getPickupStats(pickups);

  const getUpcomingPickups = () => {
    return pickups.filter(
      (p) => p.status !== "completed" && p.status !== "cancelled",
    );
  };

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
    <View
      style={[
        {
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 16,
          backgroundColor: getStatusColor(status) + "20",
        },
      ]}
    >
      <Text
        style={[
          {
            fontSize: 12,
            fontWeight: "600",
            color: getStatusColor(status),
            textTransform: "capitalize",
          },
        ]}
      >
        {status.replace("-", " ")}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={{ marginTop: 16, fontSize: 16, color: "#6b7280" }}>
            Loading your dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
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
              <Ionicons name="storefront" size={24} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 24, fontWeight: "bold", color: "white" }}
              >
                Welcome back, {user?.name || "Vendor"}!
              </Text>
              <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
                {user?.businessName || "Manage your pickup requests"}
              </Text>
            </View>
            <TouchableOpacity style={{ padding: 8 }}>
              <Ionicons name="notifications-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.15)",
                borderRadius: 16,
                padding: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 24, fontWeight: "bold", color: "white" }}
              >
                {getUpcomingPickups().length}
              </Text>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
                Upcoming
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.15)",
                borderRadius: 16,
                padding: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 24, fontWeight: "bold", color: "white" }}
              >
                {stats.completed}
              </Text>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
                Completed
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.15)",
                borderRadius: 16,
                padding: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 24, fontWeight: "bold", color: "white" }}
              >
                {stats.totalBottles}
              </Text>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
                Total Bottles
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={{ padding: 20 }}>
          {/* Quick Actions */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: 16,
              }}
            >
              Quick Actions
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("ScheduleTab" as never)}
              style={{
                backgroundColor: "#3b82f6",
                borderRadius: 16,
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                shadowColor: "#3b82f6",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <Ionicons name="calendar-outline" size={24} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 18, fontWeight: "bold", color: "white" }}
                >
                  Schedule New Pickup
                </Text>
                <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
                  Request a bottle collection
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Recent Pickups */}
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                style={{ fontSize: 20, fontWeight: "bold", color: "#1f2937" }}
              >
                Recent Pickups
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("HistoryTab" as never)}
              >
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: "#3b82f6" }}
                >
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            {pickups.length > 0 ? (
              <View style={{ gap: 12 }}>
                {pickups.slice(0, 5).map((pickup) => (
                  <TouchableOpacity
                    key={pickup.id}
                    onPress={() =>
                      navigation.navigate(
                        "PickupDetails" as never,
                        { pickup } as never,
                      )
                    }
                    style={{
                      backgroundColor: "white",
                      borderRadius: 16,
                      padding: 16,
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
                        justifyContent: "space-between",
                        alignItems: "start",
                        marginBottom: 12,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 4,
                          }}
                        >
                          <Ionicons
                            name="wine-outline"
                            size={16}
                            color="#3b82f6"
                          />
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "bold",
                              color: "#1f2937",
                              marginLeft: 8,
                            }}
                          >
                            {pickup.bottleCount} bottles
                          </Text>
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 4,
                          }}
                        >
                          <Ionicons
                            name="calendar-outline"
                            size={14}
                            color="#6b7280"
                          />
                          <Text
                            style={{
                              fontSize: 14,
                              color: "#6b7280",
                              marginLeft: 8,
                            }}
                          >
                            {formatPickupDate(
                              pickup.scheduledDate,
                              pickup.scheduledTime,
                            )}
                          </Text>
                        </View>
                        {pickup.address && (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginBottom: 4,
                            }}
                          >
                            <Ionicons
                              name="location-outline"
                              size={14}
                              color="#6b7280"
                            />
                            <Text
                              style={{
                                fontSize: 14,
                                color: "#6b7280",
                                marginLeft: 8,
                              }}
                            >
                              {pickup.address}
                            </Text>
                          </View>
                        )}
                        {pickup.driverName && (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <Ionicons
                              name="person-outline"
                              size={14}
                              color="#6b7280"
                            />
                            <Text
                              style={{
                                fontSize: 14,
                                color: "#6b7280",
                                marginLeft: 8,
                              }}
                            >
                              Driver: {pickup.driverName}
                            </Text>
                          </View>
                        )}
                      </View>
                      <StatusBadge status={pickup.status} />
                    </View>

                    {pickup.notes && (
                      <View
                        style={{
                          backgroundColor: "#f8fafc",
                          borderRadius: 8,
                          padding: 12,
                          marginTop: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#6b7280",
                            fontStyle: "italic",
                          }}
                        >
                          "{pickup.notes}"
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: "white",
                  borderRadius: 16,
                  padding: 32,
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: "#e5e7eb",
                  borderStyle: "dashed",
                }}
              >
                <Ionicons name="wine-outline" size={48} color="#d1d5db" />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: "#6b7280",
                    marginTop: 16,
                  }}
                >
                  No pickups yet
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#9ca3af",
                    textAlign: "center",
                    marginTop: 8,
                  }}
                >
                  Schedule your first pickup to get started with bottle
                  collection services
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("ScheduleTab" as never)}
                  style={{
                    backgroundColor: "#3b82f6",
                    borderRadius: 12,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    marginTop: 16,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "600" }}>
                    Schedule Pickup
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Tips & Information */}
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 20,
              borderLeftWidth: 4,
              borderLeftColor: "#3b82f6",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Ionicons name="information-circle" size={24} color="#3b82f6" />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "#1f2937",
                  marginLeft: 12,
                }}
              >
                How it Works
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: "#6b7280", lineHeight: 20 }}>
              1. Schedule a pickup with date, time, and bottle count{"\n"}
              2. A driver will be assigned to your request{"\n"}
              3. The driver will collect your bottles at the scheduled time
              {"\n"}
              4. Receive confirmation with photos when completed
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
