import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
} from "firebase/firestore";
import { db } from "../../config/firebase";

interface Pickup {
  id: string;
  vendorId: string;
  vendorName?: string;
  vendorBusinessName?: string;
  driverId?: string;
  driverName?: string;
  scheduledDate: any;
  bottleCount: number;
  status: string;
  address?: string;
  cancelledAt?: string;
  cancelReason?: string;
  completedAt?: string;
  createdAt: any;
}

export const PickupManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [cancellations, setCancellations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "pending" | "assigned" | "completed" | "cancelled" | "expired"
  >("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // Load pickups
    const unsubscribePickups = onSnapshot(
      query(collection(db, "pickups"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const pickupData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Pickup[];
        setPickups(pickupData);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading pickups:", error);
        setLoading(false);
      },
    );

    // Load cancellations
    const unsubscribeCancellations = onSnapshot(
      query(collection(db, "cancellations"), orderBy("cancelledAt", "desc")),
      (snapshot) => {
        const cancellationData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCancellations(cancellationData);
      },
      (error) => {
        console.error("Error loading cancellations:", error);
      },
    );

    return () => {
      unsubscribePickups();
      unsubscribeCancellations();
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const isPickupExpired = (pickup: Pickup) => {
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

  const getFilteredPickups = () => {
    if (selectedFilter === "cancelled") {
      // For cancelled filter, return cancellation records as pickup objects
      let filtered = cancellations.map((cancellation) => ({
        ...cancellation.originalPickupData,
        id: cancellation.id,
        status: "cancelled",
        driverId: cancellation.driverId,
        driverName: cancellation.driverName,
        cancelledAt: cancellation.cancelledAt,
        cancelReason: cancellation.cancelReason,
        // Include vendor info for search functionality
        vendorName: cancellation.originalPickupData.vendorName,
        vendorBusinessName: cancellation.originalPickupData.vendorBusinessName,
        address: cancellation.originalPickupData.address,
      }));

      // Apply search filter to cancellations
      if (searchQuery.trim()) {
        filtered = filtered.filter(
          (pickup) =>
            pickup.vendorName
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            pickup.vendorBusinessName
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            pickup.driverName
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            pickup.address?.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      }

      return filtered;
    }

    // For all other filters, work with regular pickups
    let filtered = pickups;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (pickup) =>
          pickup.vendorName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          pickup.vendorBusinessName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          pickup.driverName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          pickup.address?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply status filter
    if (selectedFilter === "pending") {
      filtered = filtered.filter(
        (pickup) => pickup.status === "pending" && !isPickupExpired(pickup),
      );
    } else if (selectedFilter === "assigned") {
      filtered = filtered.filter(
        (pickup) =>
          pickup.status === "assigned" || pickup.status === "in-progress",
      );
    } else if (selectedFilter === "completed") {
      filtered = filtered.filter((pickup) => pickup.status === "completed");
    } else if (selectedFilter === "expired") {
      filtered = filtered.filter((pickup) => isPickupExpired(pickup));
    }

    return filtered;
  };
  const getStatusColor = (pickup: Pickup) => {
    if (pickup.cancelledAt) return "#ef4444"; // Cancelled
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

  const getStatusText = (pickup: Pickup) => {
    if (pickup.cancelledAt) return "Cancelled";
    if (isPickupExpired(pickup)) return "Expired";
    return (
      pickup.status.charAt(0).toUpperCase() +
      pickup.status.slice(1).replace("-", " ")
    );
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

      return (
        date.toLocaleDateString() +
        " " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } catch (error) {
      return "Invalid date";
    }
  };

  const stats = {
    total: pickups.length + cancellations.length,
    pending: pickups.filter(
      (p) => p.status === "pending" && !isPickupExpired(p),
    ).length,
    assigned: pickups.filter(
      (p) => p.status === "assigned" || p.status === "in-progress",
    ).length,
    completed: pickups.filter((p) => p.status === "completed").length,
    expired: pickups.filter((p) => isPickupExpired(p)).length,
    cancelled:
      pickups.filter((p) => p.cancelledAt).length + cancellations.length,
  };
  const filteredPickups = getFilteredPickups();

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
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "white",
              marginLeft: 16,
            }}
          >
            📦 Pickup Management
          </Text>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 6 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "bold", color: "white" }}>
              {stats.total}
            </Text>
            <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.8)" }}>
              Total
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "bold", color: "white" }}>
              {stats.pending}
            </Text>
            <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.8)" }}>
              Pending
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "bold", color: "white" }}>
              {stats.assigned}
            </Text>
            <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.8)" }}>
              Assigned
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "bold", color: "white" }}>
              {stats.completed}
            </Text>
            <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.8)" }}>
              Done
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "bold", color: "white" }}>
              {stats.expired}
            </Text>
            <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.8)" }}>
              Expired
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "bold", color: "white" }}>
              {stats.cancelled}
            </Text>
            <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.8)" }}>
              Cancelled
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: 20 }}>
          {/* Search */}
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons
              name="search"
              size={20}
              color="#9ca3af"
              style={{ marginRight: 12 }}
            />
            <TextInput
              placeholder="Search pickups..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ flex: 1, fontSize: 16, color: "#1f2937" }}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 20 }}
          >
            {[
              { key: "all", label: "All" },
              { key: "pending", label: "Pending" },
              { key: "assigned", label: "Assigned" },
              { key: "completed", label: "Completed" },
              { key: "expired", label: "⏰ Expired" },
              { key: "cancelled", label: "🚫 Cancelled" },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                onPress={() => setSelectedFilter(filter.key as any)}
                style={{
                  backgroundColor:
                    selectedFilter === filter.key ? "#3b82f6" : "white",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  marginRight: 8,
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
                    color: selectedFilter === filter.key ? "white" : "#6b7280",
                  }}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Pickups List */}
          {loading ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <Text style={{ fontSize: 16, color: "#6b7280" }}>
                Loading pickups...
              </Text>
            </View>
          ) : filteredPickups.length === 0 ? (
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 16,
                padding: 40,
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
                No Pickups Found
              </Text>
              <Text
                style={{ fontSize: 14, color: "#6b7280", textAlign: "center" }}
              >
                {searchQuery
                  ? "Try adjusting your search criteria"
                  : "No pickups match the selected filter"}
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {filteredPickups.map((pickup) => (
                <View
                  key={pickup.id}
                  style={{
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
                      alignItems: "flex-start",
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
                            paddingHorizontal: 8,
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
                        {pickup.cancelledAt && (
                          <View
                            style={{
                              backgroundColor: "#fef2f2",
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 12,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: "600",
                                color: "#dc2626",
                              }}
                            >
                              CANCELLED
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "bold",
                          color: "#1f2937",
                          marginBottom: 4,
                        }}
                      >
                        {pickup.vendorName ||
                          pickup.vendorBusinessName ||
                          "Unknown Vendor"}
                      </Text>

                      <Text
                        style={{
                          fontSize: 14,
                          color: "#6b7280",
                          marginBottom: 4,
                        }}
                      >
                        📍 {pickup.address || "Address not available"}
                      </Text>

                      <Text
                        style={{
                          fontSize: 14,
                          color: "#6b7280",
                          marginBottom: 4,
                        }}
                      >
                        📅 {formatDate(pickup.scheduledDate)}
                      </Text>

                      {pickup.driverName && (
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#6b7280",
                            marginBottom: 4,
                          }}
                        >
                          🚗 Driver: {pickup.driverName}
                        </Text>
                      )}

                      {pickup.cancelledAt && pickup.cancelReason && (
                        <View
                          style={{
                            backgroundColor: "#fef2f2",
                            padding: 8,
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
                          <Text style={{ fontSize: 12, color: "#7f1d1d" }}>
                            {pickup.cancelReason}
                          </Text>
                          <Text
                            style={{
                              fontSize: 11,
                              color: "#991b1b",
                              marginTop: 4,
                            }}
                          >
                            Cancelled: {formatDate(pickup.cancelledAt)}
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
                        <Ionicons
                          name="wine-outline"
                          size={20}
                          color="#6b7280"
                        />
                      </View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "bold",
                          color: "#1f2937",
                        }}
                      >
                        {pickup.bottleCount}
                      </Text>
                      <Text style={{ fontSize: 10, color: "#6b7280" }}>
                        bottles
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
