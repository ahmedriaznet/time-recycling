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

export const DriverHistoryScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "completed" | "cancelled">(
    "all",
  );
  const navigation = useNavigation();
  const { user } = useUnifiedAuth();
  const { getPickupsForDriver, loading, error } = useFirebasePickupStore();

  // Get pickups for current driver
  const allPickups = getPickupsForDriver(user?.uid || "");

  // Filter completed and cancelled pickups for history
  const historyPickups = allPickups.filter(
    (pickup) => pickup.status === "completed" || pickup.status === "cancelled",
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log("🔥 Driver history refreshed");
    } finally {
      setRefreshing(false);
    }
  };

  const getFilteredPickups = () => {
    if (filter === "all") return historyPickups;
    return historyPickups.filter((p) => p.status === filter);
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
        {status.charAt(0).toUpperCase() + status.slice(1)}
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
              {pickup.bottleCount} bottles pickup
            </Text>
            <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
              Scheduled: {formatDate(pickup.scheduledDate)} at{" "}
              {formatTime(pickup.scheduledDate)}
            </Text>
            {pickup.completedAt && (
              <Text style={{ fontSize: 14, color: "#6b7280" }}>
                {pickup.status === "completed" ? "Completed" : "Cancelled"}:{" "}
                {formatDate(pickup.completedAt)}
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
            Pickup ID: {pickup.id.slice(-8)}
          </Text>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center" }}
            onPress={() =>
              navigation.navigate("PickupDetails" as never, { pickup } as never)
            }
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

  // Calculate stats from completed pickups
  const totalCompleted = historyPickups.filter(
    (p) => p.status === "completed",
  ).length;
  const totalBottles = historyPickups
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.bottleCount, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
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
            }}
          >
            <Ionicons name="time-outline" size={24} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>
              Pickup History
            </Text>
            <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
              Your completed pickups
            </Text>
            {error && (
              <Text
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.6)",
                  marginTop: 4,
                }}
              >
                {error}
              </Text>
            )}
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
              {totalCompleted}
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
              {totalBottles}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
              Bottles
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filters */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton
            filterType="all"
            label="All"
            count={historyPickups.length}
          />
          <FilterButton
            filterType="completed"
            label="Completed"
            count={
              historyPickups.filter((p) => p.status === "completed").length
            }
          />
          <FilterButton
            filterType="cancelled"
            label="Cancelled"
            count={
              historyPickups.filter((p) => p.status === "cancelled").length
            }
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
        {loading ? (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 32,
              alignItems: "center",
              marginTop: 20,
            }}
          >
            <Text style={{ fontSize: 16, color: "#6b7280" }}>
              Loading history...
            </Text>
          </View>
        ) : filteredPickups.length > 0 ? (
          <View style={{ paddingBottom: 20 }}>
            {filteredPickups
              .sort(
                (a, b) =>
                  new Date(b.completedAt || b.createdAt).getTime() -
                  new Date(a.completedAt || a.createdAt).getTime(),
              )
              .map((pickup, index) => (
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
              No history found
            </Text>
            <Text
              style={{ fontSize: 14, color: "#6b7280", textAlign: "center" }}
            >
              {filter === "all"
                ? "You haven't completed any pickups yet"
                : `No ${filter} pickups found`}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
