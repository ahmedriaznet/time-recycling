import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { useNotification } from "../../contexts/NotificationContext";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "driver" | "vendor";
  businessName?: string;
  businessAddress?: string;
  businessType?: string;
  vehicleInfo?: string;
  approvalStatus: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: any;
}

interface Pickup {
  id: string;
  vendorId: string;
  vendorName?: string;
  vendorBusinessName?: string;
  driverId?: string;
  driverName?: string;
  scheduledDate: any;
  bottleCount: number;
  actualBottleCount?: number;
  status: "pending" | "assigned" | "in-progress" | "completed" | "cancelled";
  notes?: string;
  createdAt: any;
  completedAt?: any;
  assignedAt?: any;
  cancelledAt?: any;
  cancelReason?: string;
  address?: string;
  contactPhone?: string;
  urgentPickup?: boolean;
  proofPhoto?: string;
}

export const UserDetailScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [cancellations, setCancellations] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<
    "upcoming" | "past" | "cancelled" | "all" | "assigned" | "completed"
  >("all");
  const navigation = useNavigation();
  const route = useRoute();
  const { showNotification } = useNotification();

  const userId = (route.params as any)?.userId;
  const userRole = (route.params as any)?.userRole;

  useEffect(() => {
    if (userId) {
      loadUserDetails();
      loadUserPickups();
      if (userRole === "driver") {
        loadUserCancellations();
        // Set default filter for drivers
        if (selectedFilter === "all") {
          setSelectedFilter("upcoming");
        }
      }
    }
  }, [userId, userRole]);

  const loadUserDetails = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        setUser({ id: userDoc.id, ...userDoc.data() } as User);
      }
    } catch (error) {
      console.error("Error loading user details:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to load user details",
      });
    }
  };

  const loadUserPickups = async () => {
    try {
      let pickupsQuery;

      if (userRole === "driver") {
        // For drivers, exclude cancelled status pickups (they're in cancellations collection)
        pickupsQuery = query(
          collection(db, "pickups"),
          where("driverId", "==", userId),
          orderBy("createdAt", "desc"),
        );
      } else {
        pickupsQuery = query(
          collection(db, "pickups"),
          where("vendorId", "==", userId),
          orderBy("createdAt", "desc"),
        );
      }

      const snapshot = await getDocs(pickupsQuery);
      const pickupsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Pickup[];

      // Filter out cancelled status pickups for drivers
      if (userRole === "driver") {
        setPickups(pickupsData.filter((p) => p.status !== "cancelled"));
      } else {
        setPickups(pickupsData);
      }
    } catch (error) {
      console.error("Error loading user pickups:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to load pickup history",
      });
    }
  };

  const loadUserCancellations = async () => {
    try {
      const cancellationsQuery = query(
        collection(db, "cancellations"),
        where("driverId", "==", userId),
        orderBy("cancelledAt", "desc"),
      );

      const snapshot = await getDocs(cancellationsQuery);
      const cancellationsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCancellations(cancellationsData);
    } catch (error) {
      console.error("Error loading user cancellations:", error);
      // Don't show error notification for cancellations
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const promises = [loadUserDetails(), loadUserPickups()];
    if (userRole === "driver") {
      promises.push(loadUserCancellations());
    }
    await Promise.all(promises);
    setRefreshing(false);
  };

  const filteredPickups = useMemo(() => {
    if (userRole === "driver") {
      // Use same filtering logic as DriverPickupsScreen
      if (selectedFilter === "upcoming") {
        // Show only assigned and in-progress pickups that don't have cancelledAt field
        return pickups.filter(
          (pickup) =>
            (pickup.status === "assigned" || pickup.status === "in-progress") &&
            !(pickup as any).cancelledAt,
        );
      } else if (selectedFilter === "past") {
        // Show only completed pickups that are NOT cancelled
        return pickups.filter((pickup) => pickup.status === "completed");
      } else if (selectedFilter === "cancelled") {
        // Show cancellation records formatted as pickup objects
        return cancellations.map((cancellation) => ({
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
    } else {
      // For vendors, use simple status-based filtering
      if (selectedFilter === "all") {
        return pickups;
      }
      return pickups.filter((pickup) => pickup.status === selectedFilter);
    }
  }, [pickups, cancellations, selectedFilter, userRole]);

  const getPickupStats = useMemo(() => {
    if (userRole === "driver") {
      return {
        total: pickups.length + cancellations.length,
        upcoming: pickups.filter(
          (p) =>
            (p.status === "assigned" || p.status === "in-progress") &&
            !(p as any).cancelledAt,
        ).length,
        completed: pickups.filter((p) => p.status === "completed").length,
        cancelled: cancellations.length,
        totalBottles: pickups.reduce(
          (sum, p) => sum + (p.actualBottleCount || p.bottleCount),
          0,
        ),
      };
    } else {
      return {
        total: pickups.length,
        assigned: pickups.filter(
          (p) => p.status === "assigned" || p.status === "in-progress",
        ).length,
        completed: pickups.filter((p) => p.status === "completed").length,
        cancelled: pickups.filter((p) => p.status === "cancelled").length,
        totalBottles: pickups.reduce(
          (sum, p) => sum + (p.actualBottleCount || p.bottleCount),
          0,
        ),
      };
    }
  }, [pickups, cancellations, userRole]);

  const formatDate = (date: any) => {
    try {
      if (date?.toDate) {
        return new Date(date.toDate()).toLocaleDateString();
      } else if (date) {
        return new Date(date).toLocaleDateString();
      }
      return "Unknown";
    } catch (error) {
      return "Unknown";
    }
  };

  const formatDateTime = (date: any) => {
    try {
      if (date?.toDate) {
        return new Date(date.toDate()).toLocaleString();
      } else if (date) {
        return new Date(date).toLocaleString();
      }
      return "Unknown";
    } catch (error) {
      return "Unknown";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#f59e0b";
      case "assigned":
      case "in-progress":
        return "#3b82f6";
      case "completed":
        return "#22c55e";
      case "cancelled":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: getStatusColor(status) + "20",
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: "600",
          color: getStatusColor(status),
          textTransform: "uppercase",
        }}
      >
        {status.replace("-", " ")}
      </Text>
    </View>
  );

  const FilterButton: React.FC<{
    filter:
      | "upcoming"
      | "past"
      | "cancelled"
      | "all"
      | "assigned"
      | "completed";
    label: string;
    count: number;
  }> = ({ filter, label, count }) => (
    <TouchableOpacity
      onPress={() => setSelectedFilter(filter)}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: selectedFilter === filter ? "#3b82f6" : "#f3f4f6",
        marginRight: 8,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: selectedFilter === filter ? "white" : "#374151",
        }}
      >
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  const StatCard: React.FC<{
    title: string;
    value: number | string;
    icon: string;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        flex: 1,
        marginHorizontal: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          backgroundColor: color + "20",
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
        }}
      >
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          color: "#1f2937",
          marginBottom: 2,
        }}
      >
        {value}
      </Text>
      <Text style={{ fontSize: 12, color: "#6b7280" }}>{title}</Text>
    </View>
  );

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ fontSize: 16, color: "#6b7280" }}>
            Loading user details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <LinearGradient
        colors={
          userRole === "driver"
            ? ["#6366f1", "#8b5cf6"]
            : ["#059669", "#10b981"]
        }
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
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
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
            <Ionicons
              name={
                userRole === "driver" ? "car-outline" : "storefront-outline"
              }
              size={24}
              color="white"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: "bold", color: "white" }}>
              {userRole === "vendor"
                ? user.businessName || user.name
                : user.name}
            </Text>
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
              {userRole === "driver" ? "Driver" : "Vendor"} •{" "}
              {user.approvalStatus}
            </Text>
          </View>
        </View>

        {/* User Info */}
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.8)",
              marginBottom: 8,
            }}
          >
            Contact Information
          </Text>
          <Text style={{ fontSize: 16, color: "white", marginBottom: 4 }}>
            📧 {user.email}
          </Text>
          {user.phone && (
            <Text style={{ fontSize: 16, color: "white", marginBottom: 4 }}>
              📞 {user.phone}
            </Text>
          )}
          {user.businessAddress && (
            <Text style={{ fontSize: 16, color: "white", marginBottom: 4 }}>
              📍 {user.businessAddress}
            </Text>
          )}
          {user.vehicleInfo && (
            <Text style={{ fontSize: 16, color: "white" }}>
              ��� {user.vehicleInfo}
            </Text>
          )}
          <Text
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.7)",
              marginTop: 8,
            }}
          >
            Member since: {formatDate(user.createdAt)}
          </Text>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: "row", marginHorizontal: -4 }}>
          <StatCard
            title="Total Pickups"
            value={getPickupStats.total}
            icon="cube-outline"
            color="#3b82f6"
          />
          <StatCard
            title="Completed"
            value={getPickupStats.completed}
            icon="checkmark-circle-outline"
            color="#22c55e"
          />
          <StatCard
            title="Total Bottles"
            value={getPickupStats.totalBottles}
            icon="wine-outline"
            color="#8b5cf6"
          />
        </View>
      </LinearGradient>

      {/* Filter Buttons */}
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {userRole === "driver" ? (
            <>
              <FilterButton
                filter="upcoming"
                label="⏰ Upcoming"
                count={getPickupStats.upcoming}
              />
              <FilterButton
                filter="past"
                label="✅ Past"
                count={getPickupStats.completed}
              />
              <FilterButton
                filter="cancelled"
                label="❌ Cancelled"
                count={getPickupStats.cancelled}
              />
              <FilterButton
                filter="all"
                label="📋 All"
                count={getPickupStats.total}
              />
            </>
          ) : (
            <>
              <FilterButton
                filter="all"
                label="All"
                count={getPickupStats.total}
              />
              <FilterButton
                filter="assigned"
                label="Active"
                count={getPickupStats.assigned}
              />
              <FilterButton
                filter="completed"
                label="Completed"
                count={getPickupStats.completed}
              />
              <FilterButton
                filter="cancelled"
                label="Cancelled"
                count={getPickupStats.cancelled}
              />
            </>
          )}
        </ScrollView>
      </View>

      {/* Pickup History */}
      <ScrollView
        style={{ flex: 1, padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredPickups.length > 0 ? (
          <View style={{ gap: 12 }}>
            {filteredPickups.map((pickup) => (
              <View
                key={pickup.id}
                style={{
                  backgroundColor: "white",
                  borderRadius: 12,
                  padding: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                  borderLeftWidth: 4,
                  borderLeftColor: getStatusColor(pickup.status),
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
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: "#1f2937",
                        marginBottom: 4,
                      }}
                    >
                      {userRole === "driver"
                        ? pickup.vendorBusinessName ||
                          pickup.vendorName ||
                          "Vendor Pickup"
                        : `Pickup #${pickup.id.slice(-6)}`}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#6b7280",
                        marginBottom: 2,
                      }}
                    >
                      📅 Scheduled: {formatDateTime(pickup.scheduledDate)}
                    </Text>
                    {pickup.address && (
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#6b7280",
                          marginBottom: 2,
                        }}
                      >
                        📍 {pickup.address}
                      </Text>
                    )}
                    {userRole === "vendor" && pickup.driverName && (
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#6b7280",
                          marginBottom: 2,
                        }}
                      >
                        🚗 Driver: {pickup.driverName}
                      </Text>
                    )}
                  </View>
                  <StatusBadge status={pickup.status} />
                </View>

                <View
                  style={{ flexDirection: "row", gap: 16, marginBottom: 12 }}
                >
                  <View
                    style={{
                      backgroundColor: "#f9fafb",
                      padding: 8,
                      borderRadius: 8,
                      flex: 1,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        marginBottom: 2,
                      }}
                    >
                      Requested Bottles
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: "#1f2937",
                      }}
                    >
                      {pickup.bottleCount}
                    </Text>
                  </View>
                  {pickup.actualBottleCount !== undefined && (
                    <View
                      style={{
                        backgroundColor: "#f0f9ff",
                        padding: 8,
                        borderRadius: 8,
                        flex: 1,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#0369a1",
                          marginBottom: 2,
                        }}
                      >
                        Actual Bottles
                      </Text>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: "#1f2937",
                        }}
                      >
                        {pickup.actualBottleCount}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Timeline */}
                <View
                  style={{
                    backgroundColor: "#f9fafb",
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: 8,
                    }}
                  >
                    Timeline:
                  </Text>
                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 12, color: "#6b7280" }}>
                      📝 Created: {formatDateTime(pickup.createdAt)}
                    </Text>
                    {pickup.assignedAt && (
                      <Text style={{ fontSize: 12, color: "#6b7280" }}>
                        ✅ Assigned: {formatDateTime(pickup.assignedAt)}
                      </Text>
                    )}
                    {pickup.completedAt && (
                      <Text style={{ fontSize: 12, color: "#22c55e" }}>
                        🎉 Completed: {formatDateTime(pickup.completedAt)}
                      </Text>
                    )}
                    {pickup.cancelledAt && (
                      <Text style={{ fontSize: 12, color: "#ef4444" }}>
                        ❌ Cancelled: {formatDateTime(pickup.cancelledAt)}
                      </Text>
                    )}
                  </View>
                </View>

                {pickup.notes && (
                  <View
                    style={{
                      backgroundColor: "#fef9e7",
                      padding: 12,
                      borderRadius: 8,
                      marginTop: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: "#92400e",
                        marginBottom: 4,
                      }}
                    >
                      Notes:
                    </Text>
                    <Text style={{ fontSize: 14, color: "#374151" }}>
                      {pickup.notes}
                    </Text>
                  </View>
                )}

                {pickup.cancelReason && (
                  <View
                    style={{
                      backgroundColor: "#fef2f2",
                      padding: 12,
                      borderRadius: 8,
                      marginTop: 8,
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
                      Cancellation Reason:
                    </Text>
                    <Text style={{ fontSize: 14, color: "#374151" }}>
                      {pickup.cancelReason}
                    </Text>
                  </View>
                )}

                {pickup.urgentPickup && (
                  <View
                    style={{
                      backgroundColor: "#fef3c7",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                      alignSelf: "flex-start",
                      marginTop: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: "#92400e",
                      }}
                    >
                      ⚡ URGENT PICKUP
                    </Text>
                  </View>
                )}
              </View>
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
              No {selectedFilter === "all" ? "" : selectedFilter} pickups
            </Text>
            <Text
              style={{ fontSize: 14, color: "#6b7280", textAlign: "center" }}
            >
              {selectedFilter === "all"
                ? `No pickup history found for this ${userRole}`
                : `No ${selectedFilter === "assigned" ? "active" : selectedFilter} pickups found`}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
