import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../../config/firebase";

interface Driver {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isAvailable: boolean;
  lastAvailabilityChange?: any;
  approvalStatus: string;
}

interface AvailabilityRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  isAvailable: boolean;
  timestamp: any;
  previousStatus: boolean;
}

export const DriverAvailabilityScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [availabilityHistory, setAvailabilityHistory] = useState<
    AvailabilityRecord[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "available" | "unavailable"
  >("all");
  const navigation = useNavigation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load approved drivers
      const driversQuery = query(
        collection(db, "users"),
        where("role", "==", "driver"),
        where("approvalStatus", "==", "approved"),
      );
      const driversSnapshot = await getDocs(driversQuery);
      const driversData = driversSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Driver[];

      setDrivers(driversData);

      // Load recent availability history
      const historyQuery = query(
        collection(db, "availabilityHistory"),
        orderBy("timestamp", "desc"),
        limit(50),
      );
      const historySnapshot = await getDocs(historyQuery);
      const historyData = historySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AvailabilityRecord[];

      setAvailabilityHistory(historyData);
    } catch (error) {
      console.error("Error loading availability data:", error);
      Alert.alert("Error", "Failed to load availability data");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getFilteredDrivers = () => {
    let filtered = drivers;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (driver) =>
          driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          driver.email.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply availability filter
    if (selectedFilter === "available") {
      filtered = filtered.filter((driver) => driver.isAvailable);
    } else if (selectedFilter === "unavailable") {
      filtered = filtered.filter((driver) => !driver.isAvailable);
    }

    return filtered;
  };

  const getAvailabilityStats = () => {
    const total = drivers.length;
    const available = drivers.filter((d) => d.isAvailable).length;
    const unavailable = total - available;
    const availabilityRate = total > 0 ? (available / total) * 100 : 0;

    return { total, available, unavailable, availabilityRate };
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "Unknown";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return "Unknown";
    }
  };

  const getTimeSinceLastChange = (timestamp: any) => {
    if (!timestamp) return "Unknown";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
      } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
      } else {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
      }
    } catch (error) {
      return "Unknown";
    }
  };

  const stats = getAvailabilityStats();
  const filteredDrivers = getFilteredDrivers();

  const FilterButton: React.FC<{
    title: string;
    count: number;
    isSelected: boolean;
    onPress: () => void;
  }> = ({ title, count, isSelected, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: isSelected ? "#3b82f6" : "white",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
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
          color: isSelected ? "white" : "#6b7280",
        }}
      >
        {title} ({count})
      </Text>
    </TouchableOpacity>
  );

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
            Driver Availability
          </Text>
        </View>

        {/* Stats Overview */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "white" }}>
              {stats.available}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
              Available
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
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "white" }}>
              {stats.unavailable}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
              Unavailable
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
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "white" }}>
              {stats.availabilityRate.toFixed(0)}%
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
              Availability
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
          {/* Search and Filters */}
          <View style={{ marginBottom: 20 }}>
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
                placeholder="Search drivers..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{
                  flex: 1,
                  fontSize: 16,
                  color: "#1f2937",
                }}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <FilterButton
                title="All"
                count={drivers.length}
                isSelected={selectedFilter === "all"}
                onPress={() => setSelectedFilter("all")}
              />
              <FilterButton
                title="Available"
                count={stats.available}
                isSelected={selectedFilter === "available"}
                onPress={() => setSelectedFilter("available")}
              />
              <FilterButton
                title="Unavailable"
                count={stats.unavailable}
                isSelected={selectedFilter === "unavailable"}
                onPress={() => setSelectedFilter("unavailable")}
              />
            </ScrollView>
          </View>

          {/* Drivers List */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: 16,
              }}
            >
              Drivers ({filteredDrivers.length})
            </Text>

            {filteredDrivers.length > 0 ? (
              <View style={{ gap: 12 }}>
                {filteredDrivers.map((driver) => (
                  <View
                    key={driver.id}
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
                        alignItems: "center",
                        justifyContent: "space-between",
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
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "bold",
                              color: "#1f2937",
                              marginRight: 8,
                            }}
                          >
                            {driver.name}
                          </Text>
                          <View
                            style={{
                              backgroundColor: driver.isAvailable
                                ? "#22c55e20"
                                : "#ef444420",
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 12,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: "600",
                                color: driver.isAvailable
                                  ? "#22c55e"
                                  : "#ef4444",
                              }}
                            >
                              {driver.isAvailable ? "Available" : "Unavailable"}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#6b7280",
                            marginBottom: 4,
                          }}
                        >
                          {driver.email}
                        </Text>
                        {driver.phone && (
                          <Text
                            style={{
                              fontSize: 14,
                              color: "#6b7280",
                              marginBottom: 4,
                            }}
                          >
                            {driver.phone}
                          </Text>
                        )}
                        {driver.lastAvailabilityChange && (
                          <Text style={{ fontSize: 12, color: "#9ca3af" }}>
                            Last changed:{" "}
                            {getTimeSinceLastChange(
                              driver.lastAvailabilityChange,
                            )}
                          </Text>
                        )}
                      </View>
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          backgroundColor: driver.isAvailable
                            ? "#22c55e"
                            : "#ef4444",
                          borderRadius: 6,
                        }}
                      />
                    </View>
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
                <Ionicons name="search" size={48} color="#9ca3af" />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: "#1f2937",
                    marginTop: 16,
                    marginBottom: 8,
                  }}
                >
                  No Drivers Found
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#6b7280",
                    textAlign: "center",
                  }}
                >
                  {searchQuery
                    ? "Try adjusting your search criteria"
                    : "No drivers match the selected filter"}
                </Text>
              </View>
            )}
          </View>

          {/* Recent Activity */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: 16,
              }}
            >
              Recent Availability Changes
            </Text>

            {availabilityHistory.length > 0 ? (
              <View style={{ gap: 8 }}>
                {availabilityHistory.slice(0, 10).map((record) => (
                  <View
                    key={record.id}
                    style={{
                      backgroundColor: "white",
                      borderRadius: 12,
                      padding: 12,
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
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: "#1f2937",
                            marginBottom: 2,
                          }}
                        >
                          {record.userName}
                        </Text>
                        <Text style={{ fontSize: 12, color: "#6b7280" }}>
                          {record.isAvailable
                            ? "Became available"
                            : "Became unavailable"}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#9ca3af" }}>
                          {formatTimestamp(record.timestamp)}
                        </Text>
                      </View>
                      <View
                        style={{
                          backgroundColor: record.isAvailable
                            ? "#22c55e20"
                            : "#ef444420",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8,
                        }}
                      >
                        <Ionicons
                          name={
                            record.isAvailable
                              ? "checkmark-circle"
                              : "close-circle"
                          }
                          size={16}
                          color={record.isAvailable ? "#22c55e" : "#ef4444"}
                        />
                      </View>
                    </View>
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
                <Ionicons name="time-outline" size={48} color="#9ca3af" />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: "#1f2937",
                    marginTop: 16,
                    marginBottom: 8,
                  }}
                >
                  No Activity Yet
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#6b7280",
                    textAlign: "center",
                  }}
                >
                  Availability changes will appear here
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
