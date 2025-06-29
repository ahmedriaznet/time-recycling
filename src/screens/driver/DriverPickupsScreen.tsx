import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useFirebasePickupStore } from "../../contexts/FirebasePickupStore";
import { useUnifiedAuth } from "../../hooks/useUnifiedAuth";

export const DriverPickupsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useUnifiedAuth();
  const { getPickupsForDriver, getCancellationsForDriver } =
    useFirebasePickupStore();

  // Get filter from route params
  const routeFilter = (route.params as any)?.filter;

  const [selectedFilter, setSelectedFilter] = useState<
    "upcoming" | "past" | "cancelled" | "all"
  >(routeFilter || "upcoming");
  const [refreshing, setRefreshing] = useState(false);

  // Get pickups and cancellations for current driver
  const allPickups = getPickupsForDriver(user?.uid || "");
  const allCancellations = getCancellationsForDriver(user?.uid || "");

  // Combine pickups and cancellations based on selected filter
  const filteredPickups = React.useMemo(() => {
    if (selectedFilter === "upcoming") {
      // Show only assigned and in-progress pickups that don't have cancelledAt field
      return allPickups.filter(
        (pickup) =>
          (pickup.status === "assigned" || pickup.status === "in-progress") &&
          !(pickup as any).cancelledAt,
      );
    } else if (selectedFilter === "past") {
      // Show only completed pickups
      return allPickups.filter((pickup) => pickup.status === "completed");
    } else if (selectedFilter === "cancelled") {
      // Show cancellation records formatted as pickup objects
      return allCancellations.map((cancellation) => ({
        ...cancellation.originalPickupData,
        id: cancellation.id,
        status: "cancelled",
        driverId: cancellation.driverId,
        driverName: cancellation.driverName,
        cancelledAt: cancellation.cancelledAt,
        cancelReason: cancellation.cancelReason,
      }));
    } else {
      // "all" - show both pickups and cancellations
      const cancellationPickups = allCancellations.map((cancellation) => ({
        ...cancellation.originalPickupData,
        id: cancellation.id,
        status: "cancelled",
        driverId: cancellation.driverId,
        driverName: cancellation.driverName,
        cancelledAt: cancellation.cancelledAt,
        cancelReason: cancellation.cancelReason,
      }));
      return [...allPickups, ...cancellationPickups];
    }
  }, [allPickups, allCancellations, selectedFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return "Today";
    if (isTomorrow) return "Tomorrow";
    return date.toLocaleDateString();
  };

  const getStatusColor = (pickup: any) => {
    if (pickup.status === "cancelled" || pickup.cancelledAt) return "#ef4444"; // Cancelled
    switch (pickup.status) {
      case "assigned":
        return "#3b82f6";
      case "in-progress":
        return "#f59e0b";
      case "completed":
        return "#22c55e";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (pickup: any) => {
    if (pickup.status === "cancelled" || pickup.cancelledAt)
      return "close-circle-outline"; // Cancelled
    switch (pickup.status) {
      case "assigned":
        return "time-outline";
      case "in-progress":
        return "car-outline";
      case "completed":
        return "checkmark-circle-outline";
      default:
        return "help-outline";
    }
  };

  const getStatusText = (pickup: any) => {
    if (pickup.status === "cancelled" || pickup.cancelledAt) return "Cancelled";
    return pickup.status === "in-progress"
      ? "In Progress"
      : pickup.status.charAt(0).toUpperCase() + pickup.status.slice(1);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* Enhanced Header */}
      <LinearGradient
        colors={["#6366f1", "#8b5cf6", "#d946ef"]}
        style={{
          paddingHorizontal: 20,
          paddingVertical: 35,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 32,
                fontWeight: "bold",
                color: "white",
                marginBottom: 4,
              }}
            >
              📋 My Pickups
            </Text>
            <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
              Manage your assigned deliveries
            </Text>
          </View>
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 24,
              alignItems: "center",
              minWidth: 80,
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>
              {filteredPickups.length}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: "rgba(255,255,255,0.8)",
              }}
            >
              {selectedFilter === "upcoming"
                ? "Upcoming"
                : selectedFilter === "past"
                  ? "Past"
                  : selectedFilter === "cancelled"
                    ? "Cancelled"
                    : "Total"}
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 16,
              padding: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "white" }}>
              {
                allPickups.filter(
                  (p) => p.status === "assigned" || p.status === "in-progress",
                ).length
              }
            </Text>
            <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>
              Upcoming
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 16,
              padding: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "white" }}>
              {allPickups.filter((p) => p.status === "completed").length}
            </Text>
            <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>
              Completed
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 16,
              padding: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "white" }}>
              {allCancellations.length}
            </Text>
            <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>
              Cancelled
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 16,
              padding: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "white" }}>
              {allPickups.length + allCancellations.length}
            </Text>
            <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>
              Total
            </Text>
          </View>
        </View>

        {/* Simple Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 4 }}
        >
          {[
            { key: "upcoming", label: "⏰ Upcoming" },
            { key: "past", label: "✅ Past" },
            { key: "cancelled", label: "❌ Cancelled" },
            { key: "all", label: "📋 All" },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setSelectedFilter(filter.key as any)}
              style={{
                backgroundColor:
                  selectedFilter === filter.key
                    ? "rgba(255,255,255,0.9)"
                    : "rgba(255,255,255,0.15)",
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 25,
                marginRight: 12,
                borderWidth: selectedFilter === filter.key ? 2 : 0,
                borderColor: "rgba(255,255,255,0.3)",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: selectedFilter === filter.key ? "700" : "600",
                  color: selectedFilter === filter.key ? "#6366f1" : "white",
                }}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={{ flex: 1, padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredPickups.length === 0 ? (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 20,
              padding: 40,
              alignItems: "center",
              marginTop: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                backgroundColor: "#f3f4f6",
                borderRadius: 40,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <Ionicons name="clipboard-outline" size={40} color="#9ca3af" />
            </View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              {selectedFilter === "upcoming" && "No Upcoming Pickups"}
              {selectedFilter === "past" && "No Past Pickups"}
              {selectedFilter === "cancelled" && "No Cancelled Pickups"}
              {selectedFilter === "all" && "No Pickups Found"}
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: "#6b7280",
                textAlign: "center",
                marginBottom: 24,
                lineHeight: 24,
              }}
            >
              {selectedFilter === "upcoming" &&
                "You don't have any upcoming pickups. Check available pickups to find new jobs."}
              {selectedFilter === "past" &&
                "Complete some pickups to see your history here."}
              {selectedFilter === "cancelled" &&
                "You haven't cancelled any pickups yet."}
              {selectedFilter === "all" &&
                "Start by accepting some pickups from the available list."}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("AvailableTab" as never)}
              style={{
                backgroundColor: "#6366f1",
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 24,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "white",
                }}
              >
                Find Pickups
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {filteredPickups.map((pickup) => (
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
                  borderRadius: 20,
                  padding: 20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                  borderLeftWidth: 4,
                  borderLeftColor: getStatusColor(pickup),
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 16,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: getStatusColor(pickup) + "20",
                          paddingHorizontal: 12,
                          paddingVertical: 4,
                          borderRadius: 12,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Ionicons
                          name={getStatusIcon(pickup)}
                          size={14}
                          color={getStatusColor(pickup)}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: getStatusColor(pickup),
                            textTransform: "capitalize",
                          }}
                        >
                          {getStatusText(pickup)}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        color: "#1f2937",
                        marginBottom: 4,
                      }}
                    >
                      {pickup.vendorName ||
                        pickup.vendorBusinessName ||
                        "Vendor"}
                    </Text>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color="#6b7280"
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#6b7280",
                          flex: 1,
                        }}
                      >
                        {pickup.address ||
                          pickup.vendorAddress ||
                          "Address not available"}
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                        color="#6b7280"
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#6b7280",
                        }}
                      >
                        {formatDateTime(pickup.scheduledDate)}
                      </Text>
                    </View>
                  </View>

                  <View style={{ alignItems: "center", marginLeft: 16 }}>
                    <View
                      style={{
                        backgroundColor: "#f3f4f6",
                        borderRadius: 20,
                        padding: 12,
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Ionicons name="wine-outline" size={24} color="#6b7280" />
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: "#1f2937",
                      }}
                    >
                      {pickup.bottleCount}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                      }}
                    >
                      bottles
                    </Text>
                  </View>
                </View>

                {(pickup as any).cancelledAt &&
                  (pickup as any).cancelReason && (
                    <View
                      style={{
                        backgroundColor: "#fef2f2",
                        padding: 12,
                        borderRadius: 12,
                        marginTop: 8,
                        borderWidth: 1,
                        borderColor: "#fecaca",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: "#dc2626",
                          marginBottom: 4,
                        }}
                      >
                        ❌ Cancellation Reason:
                      </Text>
                      <Text style={{ fontSize: 14, color: "#7f1d1d" }}>
                        {(pickup as any).cancelReason}
                      </Text>
                      <Text
                        style={{ fontSize: 12, color: "#991b1b", marginTop: 4 }}
                      >
                        Cancelled: {formatDateTime((pickup as any).cancelledAt)}
                      </Text>
                    </View>
                  )}

                {pickup.notes && !(pickup as any).cancelledAt && (
                  <View
                    style={{
                      backgroundColor: "#f9fafb",
                      padding: 12,
                      borderRadius: 12,
                      marginTop: 8,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: "#6b7280" }}>
                      📝 {pickup.notes}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};
