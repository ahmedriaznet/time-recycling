import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useFirebasePickupStore } from "../../contexts/FirebasePickupStore";
import { useUnifiedAuth } from "../../hooks/useUnifiedAuth";
import { NotificationBadge } from "../../components/NotificationBadge";
import { MapViewComponent } from "../../components/MapViewComponent";
import { NavigationUtils } from "../../utils/navigationUtils";
import { UserAvatar } from "../../components/UserAvatar";

const { width } = Dimensions.get("window");

interface AssignedPickup {
  id: string;
  vendorId: string;
  vendorName?: string;
  vendorAddress?: string;
  driverId: string;
  scheduledDate: string;
  bottleCount: number;
  status: "assigned" | "in-progress" | "completed";
  notes?: string;
  address?: string;
  distance?: string;
  contactPhone?: string;
  urgentPickup?: boolean;
}

export const DriverDashboard: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const navigation = useNavigation();
  const { user } = useUnifiedAuth();
  const { getPickupsForDriver, loading, error } = useFirebasePickupStore();

  // Get pickups for current driver
  const pickups = getPickupsForDriver(user?.uid || "");

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      console.log("Refreshing driver dashboard...");
      await new Promise((resolve) => setTimeout(resolve, 500)); // Brief delay for UX
      console.log("✅ Driver dashboard refreshed");
    } catch (error) {
      console.error("❌ Error refreshing dashboard:", error);
    } finally {
      setRefreshing(false); // Always reset refreshing state
    }
  };

  const getTodaysPickups = () => {
    const today = new Date().toDateString();
    return pickups.filter(
      (p) =>
        new Date(p.scheduledDate).toDateString() === today &&
        !(p as any).cancelledAt, // Exclude cancelled pickups
    );
  };

  const getUpcomingPickups = () => {
    const today = new Date();
    return pickups.filter(
      (p) => new Date(p.scheduledDate) > today && !(p as any).cancelledAt, // Exclude cancelled pickups
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
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
      case "assigned":
        return "#3b82f6";
      case "in-progress":
        return "#8b5cf6";
      case "completed":
        return "#22c55e";
      default:
        return "#6b7280";
    }
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
          { fontSize: 12, fontWeight: "600", color: getStatusColor(status) },
        ]}
      >
        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
      </Text>
    </View>
  );

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
          colors={["#4facfe", "#00f2fe"]}
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
                overflow: "hidden",
              }}
            >
              <UserAvatar
                userId={user?.uid || ""}
                size={48}
                fallbackText="🚗"
                style={{ backgroundColor: "transparent" }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 24, fontWeight: "bold", color: "white" }}
              >
                Driver Dashboard
              </Text>
              <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
                You have {getTodaysPickups().length} pickups today
              </Text>
            </View>
            <NotificationBadge color="white" size={24} />
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
                {pickups.filter((p) => p.status !== "completed").length}
              </Text>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
                Active
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
                {getTodaysPickups().length}
              </Text>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
                Today
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
                {pickups.reduce((sum, p) => sum + p.bottleCount, 0)}
              </Text>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
                Bottles
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={{ padding: 20 }}>
          {/* View Toggle */}
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: "row",
                backgroundColor: "#f3f4f6",
                borderRadius: 12,
                padding: 4,
              }}
            >
              <TouchableOpacity
                onPress={() => setViewMode("list")}
                style={[
                  {
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 8,
                    borderRadius: 8,
                  },
                  viewMode === "list"
                    ? {
                        backgroundColor: "white",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 1,
                      }
                    : {},
                ]}
              >
                <Ionicons
                  name="list-outline"
                  size={20}
                  color={viewMode === "list" ? "#3b82f6" : "#6b7280"}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[
                    { fontSize: 14, fontWeight: "600" },
                    viewMode === "list"
                      ? { color: "#3b82f6" }
                      : { color: "#6b7280" },
                  ]}
                >
                  List View
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setViewMode("map")}
                style={[
                  {
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 8,
                    borderRadius: 8,
                  },
                  viewMode === "map"
                    ? {
                        backgroundColor: "white",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 1,
                      }
                    : {},
                ]}
              >
                <Ionicons
                  name="map-outline"
                  size={20}
                  color={viewMode === "map" ? "#3b82f6" : "#6b7280"}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[
                    { fontSize: 14, fontWeight: "600" },
                    viewMode === "map"
                      ? { color: "#3b82f6" }
                      : { color: "#6b7280" },
                  ]}
                >
                  Map View
                </Text>
              </TouchableOpacity>
            </View>
          </View>

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
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => navigation.navigate("RoutePlanner" as never)}
                style={{
                  flex: 1,
                  backgroundColor: "#3b82f6",
                  borderRadius: 16,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="navigate-outline"
                  size={24}
                  color="white"
                  style={{ marginBottom: 8 }}
                />
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: "white" }}
                >
                  Route Planner
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate("AvailableTab" as never)}
                style={{
                  flex: 1,
                  backgroundColor: "#22c55e",
                  borderRadius: 16,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="cube-outline"
                  size={24}
                  color="white"
                  style={{ marginBottom: 8 }}
                />
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: "white" }}
                >
                  Browse Pickups
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Today's Pickups */}
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
                Today's Pickups
              </Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate(
                    "MyPickupsTab" as never,
                    {
                      screen: "MyPickups",
                      params: { filter: "today" },
                    } as never,
                  )
                }
              >
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: "#3b82f6" }}
                >
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            {viewMode === "map" && (
              <MapViewComponent
                pickups={getTodaysPickups()}
                onSwitchToList={() => setViewMode("list")}
              />
            )}

            {viewMode === "list" ? (
              getTodaysPickups().length > 0 ? (
                <View style={{ gap: 12 }}>
                  {getTodaysPickups()
                    .slice(0, 3)
                    .map((pickup) => (
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
                          borderRadius: 12,
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
                            marginBottom: 8,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: "bold",
                                color: "#1f2937",
                                marginBottom: 4,
                              }}
                            >
                              {pickup.vendorName}
                            </Text>
                            <Text
                              style={{
                                fontSize: 14,
                                color: "#6b7280",
                                marginBottom: 4,
                              }}
                            >
                              {pickup.bottleCount} bottles
                            </Text>
                            <Text style={{ fontSize: 14, color: "#6b7280" }}>
                              {formatTime(pickup.scheduledDate)}
                            </Text>
                          </View>
                          <StatusBadge status={pickup.status} />
                        </View>

                        {pickup.notes && (
                          <Text
                            style={{
                              fontSize: 14,
                              color: "#6b7280",
                              marginBottom: 12,
                            }}
                          >
                            Note: {pickup.notes}
                          </Text>
                        )}

                        <View style={{ flexDirection: "row", gap: 8 }}>
                          <TouchableOpacity
                            onPress={() =>
                              NavigationUtils.openNavigation({
                                address:
                                  pickup.address || pickup.vendorAddress || "",
                                label: pickup.vendorName,
                              })
                            }
                            style={{
                              flex: 1,
                              backgroundColor: "#f3f4f6",
                              borderRadius: 8,
                              padding: 12,
                              alignItems: "center",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: "600",
                                color: "#374151",
                              }}
                            >
                              Navigate
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={{
                              flex: 1,
                              backgroundColor:
                                pickup.status === "assigned"
                                  ? "#3b82f6"
                                  : "#22c55e",
                              borderRadius: 8,
                              padding: 12,
                              alignItems: "center",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: "600",
                                color: "white",
                              }}
                            >
                              {pickup.status === "assigned"
                                ? "Start Pickup"
                                : pickup.status === "in-progress"
                                  ? "Complete"
                                  : "View"}
                            </Text>
                          </TouchableOpacity>
                        </View>
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
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Ionicons name="car-outline" size={48} color="#9ca3af" />
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: "#1f2937",
                      marginTop: 16,
                      marginBottom: 8,
                    }}
                  >
                    No pickups today
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#6b7280",
                      textAlign: "center",
                    }}
                  >
                    Check back later for new pickup assignments
                  </Text>
                </View>
              )
            ) : (
              <View
                style={{
                  backgroundColor: "white",
                  borderRadius: 16,
                  padding: 32,
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Ionicons name="map-outline" size={48} color="#9ca3af" />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: "#1f2937",
                    marginTop: 16,
                    marginBottom: 8,
                  }}
                >
                  Map View
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#6b7280",
                    textAlign: "center",
                    marginBottom: 16,
                  }}
                >
                  Interactive map integration coming soon
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: "#3b82f6",
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    style={{ fontSize: 14, fontWeight: "600", color: "white" }}
                  >
                    Switch to List
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Upcoming Pickups Preview */}
          {getUpcomingPickups().length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: "#1f2937",
                  marginBottom: 16,
                }}
              >
                Upcoming Pickups
              </Text>
              <View
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
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#1f2937",
                    marginBottom: 8,
                  }}
                >
                  {getUpcomingPickups().length} pickup
                  {getUpcomingPickups().length > 1 ? "s" : ""} scheduled
                </Text>
                <Text
                  style={{ fontSize: 14, color: "#6b7280", marginBottom: 12 }}
                >
                  Next: {formatDate(getUpcomingPickups()[0].scheduledDate)}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate(
                      "MyPickupsTab" as never,
                      {
                        screen: "MyPickups",
                        params: { filter: "upcoming" },
                      } as never,
                    )
                  }
                  style={{
                    backgroundColor: "#f3f4f6",
                    borderRadius: 8,
                    padding: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    View All Pickups
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
