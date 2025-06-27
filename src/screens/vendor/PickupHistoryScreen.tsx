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
import { useNavigation } from "@react-navigation/native";
import { useUnifiedAuth } from "../../hooks/useUnifiedAuth";
import {
  useFirebasePickupStore,
  Pickup,
} from "../../contexts/FirebasePickupStore";
// Firebase imports removed - using demo data only

export const PickupHistoryScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "pending" | "completed" | "cancelled"
  >("all");
  const navigation = useNavigation();
  const { user } = useUnifiedAuth();
  const { getPickupsForVendor, loading, error } = useFirebasePickupStore();

  // Get pickups for current vendor
  const pickups = getPickupsForVendor(user?.uid || "");

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Simulate data reload with a brief delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Demo data is already loaded, just refresh the state
      console.log("📱 Refreshing pickup history");
    } finally {
      setRefreshing(false); // Always reset refreshing state
    }
  };

  const getFilteredPickups = () => {
    if (filter === "all") return pickups;
    if (filter === "pending")
      return pickups.filter((p) =>
        ["pending", "assigned", "in-progress"].includes(p.status),
      );
    return pickups.filter((p) => p.status === filter);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
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

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
    <View
      style={[
        {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
          backgroundColor: getStatusColor(status) + "20",
          flexDirection: "row",
          alignItems: "center",
        },
      ]}
    >
      <Ionicons
        name={getStatusIcon(status) as any}
        size={14}
        color={getStatusColor(status)}
        style={{ marginRight: 4 }}
      />
      <Text
        style={[
          { fontSize: 12, fontWeight: "600", color: getStatusColor(status) },
        ]}
      >
        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
      </Text>
    </View>
  );

  const FilterButton: React.FC<{
    filterType: typeof filter;
    label: string;
    count: number;
  }> = ({ filterType, label, count }) => (
    <TouchableOpacity
      onPress={() => setFilter(filterType)}
      style={[
        {
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
          marginRight: 8,
        },
        filter === filterType
          ? { backgroundColor: "#3b82f6" }
          : { backgroundColor: "#f3f4f6" },
      ]}
    >
      <Text
        style={[
          { fontSize: 14, fontWeight: "600" },
          filter === filterType ? { color: "white" } : { color: "#374151" },
        ]}
      >
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  const TimelineItem: React.FC<{ pickup: Pickup; isLast: boolean }> = ({
    pickup,
    isLast,
  }) => (
    <View style={{ flexDirection: "row", marginBottom: 20 }}>
      {/* Timeline indicator */}
      <View style={{ alignItems: "center", marginRight: 16 }}>
        <View
          style={[
            {
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: getStatusColor(pickup.status),
            },
          ]}
        />
        {!isLast && (
          <View
            style={{
              width: 2,
              height: 40,
              backgroundColor: "#e5e7eb",
              marginTop: 8,
            }}
          />
        )}
      </View>

      {/* Content */}
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("PickupDetails" as never, { pickup } as never)
        }
        style={{
          flex: 1,
          backgroundColor: "white",
          borderRadius: 12,
          padding: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 1,
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
              {pickup.bottleCount} bottles
            </Text>
            <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
              Scheduled: {formatDate(pickup.scheduledDate)} at{" "}
              {formatTime(pickup.scheduledDate)}
            </Text>
            {pickup.driverName && (
              <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
                Driver: {pickup.driverName}
              </Text>
            )}
            {pickup.completedAt && (
              <Text style={{ fontSize: 14, color: "#6b7280" }}>
                Completed: {formatDate(pickup.completedAt)}
              </Text>
            )}
          </View>
          <StatusBadge status={pickup.status} />
        </View>

        {pickup.notes && (
          <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
            {pickup.notes}
          </Text>
        )}

        {pickup.address && (
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
              style={{ marginRight: 4 }}
            />
            <Text style={{ fontSize: 14, color: "#6b7280", flex: 1 }}>
              {pickup.address}
            </Text>
          </View>
        )}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <Text style={{ fontSize: 12, color: "#9ca3af" }}>
            Created {formatDate(pickup.createdAt)}
          </Text>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: "#3b82f6",
                marginRight: 4,
              }}
            >
              View Details
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );

  const filteredPickups = getFilteredPickups();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
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
            <Ionicons name="time-outline" size={24} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>
              Pickup History
            </Text>
            <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
              Track all your pickups
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.6)",
                marginTop: 4,
              }}
            >
              🔥 Firebase Live Data
              {error && " • " + error}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 16 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "white" }}>
              {pickups.length}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
              Total Requests
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "white" }}>
              {pickups.filter((p) => p.status === "completed").length}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
              Completed
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "white" }}>
              {pickups.reduce(
                (sum, p) =>
                  sum + (p.status === "completed" ? p.bottleCount : 0),
                0,
              )}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
              Bottles Collected
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filters */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton filterType="all" label="All" count={pickups.length} />
          <FilterButton
            filterType="pending"
            label="Active"
            count={
              pickups.filter((p) =>
                ["pending", "assigned", "in-progress"].includes(p.status),
              ).length
            }
          />
          <FilterButton
            filterType="completed"
            label="Completed"
            count={pickups.filter((p) => p.status === "completed").length}
          />
          <FilterButton
            filterType="cancelled"
            label="Cancelled"
            count={pickups.filter((p) => p.status === "cancelled").length}
          />
        </ScrollView>
      </View>

      {/* Timeline */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredPickups.length > 0 ? (
          <View style={{ paddingBottom: 20 }}>
            {filteredPickups.map((pickup, index) => (
              <TimelineItem
                key={pickup.id}
                pickup={pickup}
                isLast={index === filteredPickups.length - 1}
              />
            ))}
          </View>
        ) : (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 32,
              alignItems: "center",
              marginTop: 20,
            }}
          >
            <Ionicons name="document-outline" size={48} color="#9ca3af" />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#1f2937",
                marginTop: 16,
                marginBottom: 8,
              }}
            >
              No pickups found
            </Text>
            <Text
              style={{ fontSize: 14, color: "#6b7280", textAlign: "center" }}
            >
              {filter === "all"
                ? "You haven't scheduled any pickups yet"
                : `No ${filter === "pending" ? "active" : filter} pickups found`}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
