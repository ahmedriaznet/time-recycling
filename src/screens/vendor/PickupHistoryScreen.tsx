import React, { useState, useEffect } from "react";
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
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";

export const PickupHistoryScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "pending" | "completed" | "cancelled" | "expired"
  >("all");
  const [cancellations, setCancellations] = useState<any[]>([]);
  const navigation = useNavigation();
  const { user } = useUnifiedAuth();
  const { getPickupsForVendor, loading, error } = useFirebasePickupStore();

  // Get pickups for current vendor
  const pickups = getPickupsForVendor(user?.uid || "");

  // Load cancellation records for this vendor
  useEffect(() => {
    loadVendorCancellations();
  }, [user?.uid]);

  const loadVendorCancellations = async () => {
    if (!user?.uid) return;

    try {
      const cancellationsQuery = query(
        collection(db, "cancellations"),
        where("originalPickupData.vendorId", "==", user.uid),
        orderBy("cancelledAt", "desc"),
      );

      const snapshot = await getDocs(cancellationsQuery);
      const cancellationsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCancellations(cancellationsData);
    } catch (error) {
      console.error("Error loading vendor cancellations:", error);
    }
  };

  const isPickupExpired = (pickup: any) => {
    if (pickup.status !== "pending") return false;

    try {
      let scheduledDate;
      if (
        pickup.scheduledDate &&
        typeof pickup.scheduledDate.toDate === "function"
      ) {
        scheduledDate = pickup.scheduledDate.toDate();
      } else if (pickup.scheduledDate && pickup.scheduledDate.seconds) {
        scheduledDate = new Date(pickup.scheduledDate.seconds * 1000);
      } else {
        scheduledDate = new Date(pickup.scheduledDate);
      }

      const now = new Date();
      return scheduledDate < now;
    } catch (error) {
      return false;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadVendorCancellations();
      console.log("📱 Refreshing pickup history");
    } finally {
      setRefreshing(false);
    }
  };

  const getFilteredPickups = () => {
    if (filter === "all") {
      // Combine pickups and cancellation records
      const cancellationPickups = cancellations.map((cancellation) => ({
        ...cancellation.originalPickupData,
        id: cancellation.id,
        status: "cancelled",
        driverId: cancellation.driverId,
        driverName: cancellation.driverName,
        cancelledAt: cancellation.cancelledAt,
        cancelReason: cancellation.cancelReason,
      }));
      return [...pickups, ...cancellationPickups];
    }
    if (filter === "pending")
      return pickups.filter(
        (p) =>
          ["pending", "assigned", "in-progress"].includes(p.status) &&
          !isPickupExpired(p),
      );
    if (filter === "completed")
      return pickups.filter((p) => p.status === "completed");
    if (filter === "cancelled") {
      // Show cancellation records as pickup objects
      return cancellations.map((cancellation) => ({
        ...cancellation.originalPickupData,
        id: cancellation.id,
        status: "cancelled",
        driverId: cancellation.driverId,
        driverName: cancellation.driverName,
        cancelledAt: cancellation.cancelledAt,
        cancelReason: cancellation.cancelReason,
      }));
    }
    if (filter === "expired") {
      // Show pending pickups that are past their scheduled date
      return pickups.filter((p) => isPickupExpired(p));
    }
    return pickups;
  };

  const formatDate = (dateValue: any) => {
    try {
      let date;
      if (dateValue && typeof dateValue.toDate === "function") {
        date = dateValue.toDate();
      } else if (dateValue && dateValue.seconds) {
        date = new Date(dateValue.seconds * 1000);
      } else {
        date = new Date(dateValue);
      }

      if (isNaN(date.getTime())) return "Invalid date";

      return date.toLocaleDateString();
    } catch (error) {
      return "Invalid date";
    }
  };

  const formatDateTime = (dateValue: any) => {
    try {
      let date;
      if (dateValue && typeof dateValue.toDate === "function") {
        date = dateValue.toDate();
      } else if (dateValue && dateValue.seconds) {
        date = new Date(dateValue.seconds * 1000);
      } else {
        date = new Date(dateValue);
      }

      if (isNaN(date.getTime())) return "Invalid date";

      return (
        date.toLocaleDateString() +
        " " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } catch (error) {
      return "Invalid date";
    }
  };

  const getStatusColor = (pickup: any) => {
    if (pickup.status === "cancelled" || pickup.cancelledAt) return "#ef4444"; // Cancelled
    if (isPickupExpired(pickup)) return "#f97316"; // Expired - orange
    switch (pickup.status) {
      case "pending":
        return "#f59e0b";
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

  const getStatusText = (pickup: any) => {
    if (pickup.status === "cancelled" || pickup.cancelledAt) return "Cancelled";
    if (isPickupExpired(pickup)) return "Expired";
    return (
      pickup.status.charAt(0).toUpperCase() +
      pickup.status.slice(1).replace("-", " ")
    );
  };

  const FilterButton: React.FC<{
    filterType: "all" | "pending" | "completed" | "cancelled" | "expired";
    label: string;
    count: number;
  }> = ({ filterType, label, count }) => (
    <TouchableOpacity
      onPress={() => setFilter(filterType)}
      style={{
        backgroundColor: filter === filterType ? "#667eea" : "white",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: filter === filterType ? "white" : "#6b7280",
        }}
      >
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  const PickupCard: React.FC<{ pickup: Pickup }> = ({ pickup }) => (
    <View style={{ marginBottom: 16 }}>
      {/* Status Line */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: getStatusColor(pickup),
            marginRight: 8,
          }}
        />
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: getStatusColor(pickup),
            textTransform: "uppercase",
          }}
        >
          {getStatusText(pickup)}
        </Text>
        {pickup.driverName && (
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
          borderRadius: 16,
          padding: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
          borderLeftWidth: 4,
          borderLeftColor: getStatusColor(pickup),
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
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  backgroundColor: getStatusColor(pickup) + "20",
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                  marginRight: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: getStatusColor(pickup),
                  }}
                >
                  {getStatusText(pickup)}
                </Text>
              </View>
            </View>

            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: 4,
              }}
            >
              Pickup #{pickup.id.slice(-6)}
            </Text>

            <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
              📅 Scheduled: {formatDate(pickup.scheduledDate)}
            </Text>

            {pickup.driverName && (
              <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
                🚗 Driver: {pickup.driverName}
              </Text>
            )}

            {pickup.address && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  marginBottom: 4,
                }}
              >
                <Ionicons
                  name="location-outline"
                  size={16}
                  color="#6b7280"
                  style={{ marginRight: 4, marginTop: 2 }}
                />
                <Text style={{ fontSize: 14, color: "#6b7280", flex: 1 }}>
                  {pickup.address}
                </Text>
              </View>
            )}
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
              <Ionicons name="wine-outline" size={20} color="#6b7280" />
            </View>
            <Text
              style={{ fontSize: 14, fontWeight: "bold", color: "#1f2937" }}
            >
              {pickup.bottleCount}
            </Text>
            <Text style={{ fontSize: 10, color: "#6b7280" }}>bottles</Text>
          </View>
        </View>

        {/* Cancellation Details */}
        {(pickup as any).cancelledAt && (pickup as any).cancelReason && (
          <View
            style={{
              backgroundColor: "#fef2f2",
              padding: 12,
              borderRadius: 12,
              marginTop: 12,
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
            <Text style={{ fontSize: 12, color: "#991b1b", marginTop: 4 }}>
              Cancelled by: {pickup.driverName || "Driver"}
            </Text>
            <Text style={{ fontSize: 12, color: "#991b1b" }}>
              Cancelled: {formatDateTime((pickup as any).cancelledAt)}
            </Text>
          </View>
        )}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 12,
          }}
        >
          <Text style={{ fontSize: 12, color: "#9ca3af" }}>
            Created {formatDate(pickup.createdAt)}
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
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: "bold", color: "white" }}>
            📦 Pickup History
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ padding: 8 }}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "white" }}>
              {pickups.length + cancellations.length}
            </Text>
            <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>
              Total
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
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "white" }}>
              {pickups.filter((p) => p.status === "completed").length}
            </Text>
            <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>
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
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "white" }}>
              {cancellations.length}
            </Text>
            <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>
              Cancelled
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
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "white" }}>
              {pickups.filter((p) => isPickupExpired(p)).length}
            </Text>
            <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>
              Expired
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
            count={pickups.length + cancellations.length}
          />
          <FilterButton
            filterType="pending"
            label="📋 Active"
            count={
              pickups.filter(
                (p) =>
                  ["pending", "assigned", "in-progress"].includes(p.status) &&
                  !isPickupExpired(p),
              ).length
            }
          />
          <FilterButton
            filterType="completed"
            label="✅ Completed"
            count={pickups.filter((p) => p.status === "completed").length}
          />
          <FilterButton
            filterType="expired"
            label="⏰ Expired"
            count={pickups.filter((p) => isPickupExpired(p)).length}
          />
          <FilterButton
            filterType="cancelled"
            label="🚫 Cancelled"
            count={cancellations.length}
          />
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ fontSize: 16, color: "#6b7280" }}>
              Loading pickup history...
            </Text>
          </View>
        ) : filteredPickups.length === 0 ? (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 40,
              alignItems: "center",
              marginTop: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons name="cube-outline" size={48} color="#9ca3af" />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#1f2937",
                marginTop: 16,
                marginBottom: 8,
              }}
            >
              {filter === "all" && "No Pickups Yet"}
              {filter === "pending" && "No Active Pickups"}
              {filter === "completed" && "No Completed Pickups"}
              {filter === "cancelled" && "No Cancelled Pickups"}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#6b7280",
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              {filter === "all" && "Schedule your first pickup to get started!"}
              {filter === "pending" && "All your pickups have been completed."}
              {filter === "completed" &&
                "Complete some pickups to see them here."}
              {filter === "cancelled" && "No pickups have been cancelled yet."}
            </Text>
          </View>
        ) : (
          filteredPickups.map((pickup) => (
            <PickupCard key={pickup.id} pickup={pickup} />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};
