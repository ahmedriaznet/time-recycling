import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
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
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { useUnifiedAuth } from "../../hooks/useUnifiedAuth";
import { NotificationBadge } from "../../components/NotificationBadge";
import { UserAvatar } from "../../components/UserAvatar";

const { width } = Dimensions.get("window");

interface DashboardStats {
  totalDrivers: number;
  totalVendors: number;
  pendingDrivers: number;
  pendingVendors: number;
  totalPickups: number;
  completedPickups: number;
}

export const AdminDashboard: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalDrivers: 0,
    totalVendors: 0,
    pendingDrivers: 0,
    pendingVendors: 0,
    totalPickups: 0,
    completedPickups: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const navigation = useNavigation();
  const { user } = useUnifiedAuth();

  useEffect(() => {
    loadDashboardData();

    // Set up real-time listeners for pending drivers
    const unsubscribe = onSnapshot(
      query(
        collection(db, "users"),
        where("role", "==", "driver"),
        where("approvalStatus", "==", "pending"),
      ),
      (snapshot) => {
        setStats((prev) => ({
          ...prev,
          pendingDrivers: snapshot.size,
        }));
      },
    );

    return () => unsubscribe();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get all users
      const usersSnapshot = await getDocs(collection(db, "users"));
      const users = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Calculate user stats
      const drivers = users.filter((user) => user.role === "driver");
      const vendors = users.filter((user) => user.role === "vendor");
      const pendingDrivers = drivers.filter(
        (driver) => driver.approvalStatus === "pending",
      );
      const pendingVendors = vendors.filter(
        (vendor) => vendor.approvalStatus === "pending",
      );

      // Get pickup stats (if collection exists)
      let totalPickups = 0;
      let completedPickups = 0;
      try {
        const pickupsSnapshot = await getDocs(collection(db, "pickups"));
        const pickupsData = pickupsSnapshot.docs.map((doc) => doc.data());
        totalPickups = pickupsData.length;
        completedPickups = pickupsData.filter(
          (pickup) => pickup.status === "completed",
        ).length;
      } catch (error) {
        console.log("Pickups collection not found, using default values");
      }

      setStats({
        totalDrivers: drivers.length,
        totalVendors: vendors.length,
        pendingDrivers: pendingDrivers.length,
        pendingVendors: pendingVendors.length,
        totalPickups: totalPickups,
        completedPickups: completedPickups,
      });

      // Set recent activity (last 5 pending users)
      const recentPending = [...pendingDrivers, ...pendingVendors]
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate
            ? a.createdAt.toDate()
            : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate
            ? b.createdAt.toDate()
            : new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5);

      setRecentActivity(recentPending);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

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
              <Ionicons name="shield-checkmark" size={24} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 24, fontWeight: "bold", color: "white" }}
              >
                Admin Dashboard
              </Text>
              <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
                Welcome back, {user?.name}
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
                {stats.totalDrivers}
              </Text>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
                Total Drivers
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
                {stats.totalVendors}
              </Text>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
                Total Vendors
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
              onPress={() => navigation.navigate("PickupManagement" as never)}
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
                marginBottom: 12,
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
                <Ionicons name="cube-outline" size={24} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 18, fontWeight: "bold", color: "white" }}
                >
                  Manage Pickups
                </Text>
                <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
                  View and manage all pickup requests
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </TouchableOpacity>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("DriverApprovalTab" as never)
                }
                style={{
                  flex: 1,
                  backgroundColor: "#f59e0b",
                  borderRadius: 16,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="people-outline"
                  size={24}
                  color="white"
                  style={{ marginBottom: 8 }}
                />
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: "white" }}
                >
                  Driver Approvals
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("VendorApprovalTab" as never)
                }
                style={{
                  flex: 1,
                  backgroundColor: "#8b5cf6",
                  borderRadius: 16,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="storefront-outline"
                  size={24}
                  color="white"
                  style={{ marginBottom: 8 }}
                />
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: "white" }}
                >
                  Vendor Approvals
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Activity */}
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
                Recent Applications
              </Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("DriverApprovalTab" as never)
                }
              >
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: "#3b82f6" }}
                >
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            {recentActivity.length > 0 ? (
              <View style={{ gap: 12 }}>
                {recentActivity.map((application) => (
                  <TouchableOpacity
                    key={application.id}
                    onPress={() => {
                      if (application.role === "driver") {
                        navigation.navigate(
                          "DriverApprovalTab" as never,
                          {
                            screen: "DriverDetails",
                            params: { driver: application },
                          } as never,
                        );
                      } else {
                        navigation.navigate(
                          "VendorApprovalTab" as never,
                          {
                            screen: "VendorDetails",
                            params: { vendor: application },
                          } as never,
                        );
                      }
                    }}
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
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          backgroundColor:
                            application.role === "driver"
                              ? "#3b82f620"
                              : "#8b5cf620",
                          borderRadius: 24,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 16,
                        }}
                      >
                        <Ionicons
                          name={
                            application.role === "driver"
                              ? "car-outline"
                              : "storefront-outline"
                          }
                          size={24}
                          color={
                            application.role === "driver"
                              ? "#3b82f6"
                              : "#8b5cf6"
                          }
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "bold",
                            color: "#1f2937",
                            marginBottom: 4,
                          }}
                        >
                          {application.name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#6b7280",
                            marginBottom: 2,
                          }}
                        >
                          {application.email}
                        </Text>
                        <Text style={{ fontSize: 12, color: "#9ca3af" }}>
                          {application.role === "driver" ? "Driver" : "Vendor"}{" "}
                          • Applied:{" "}
                          {(() => {
                            try {
                              if (application.createdAt?.toDate) {
                                return new Date(
                                  application.createdAt.toDate(),
                                ).toLocaleDateString();
                              } else if (application.createdAt) {
                                return new Date(
                                  application.createdAt,
                                ).toLocaleDateString();
                              }
                              return "Unknown";
                            } catch (error) {
                              return "Unknown";
                            }
                          })()}
                        </Text>
                      </View>
                      <View
                        style={{
                          backgroundColor: "#f59e0b20",
                          paddingHorizontal: 12,
                          paddingVertical: 4,
                          borderRadius: 16,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: "#f59e0b",
                          }}
                        >
                          PENDING
                        </Text>
                      </View>
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
                <Ionicons
                  name="checkmark-circle-outline"
                  size={48}
                  color="#9ca3af"
                />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: "#1f2937",
                    marginTop: 16,
                    marginBottom: 8,
                  }}
                >
                  All Caught Up!
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#6b7280",
                    textAlign: "center",
                  }}
                >
                  No pending applications at the moment
                </Text>
              </View>
            )}
          </View>

          {/* Platform Overview */}
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 20,
              borderLeftWidth: 4,
              borderLeftColor: "#6366f1",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Ionicons name="analytics-outline" size={24} color="#6366f1" />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "#1f2937",
                  marginLeft: 12,
                }}
              >
                Platform Overview
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: "#6b7280", lineHeight: 20 }}>
              {stats.completedPickups} pickups completed successfully{"\n"}
              {stats.pendingDrivers + stats.pendingVendors} pending applications
              need review{"\n"}
              Platform is running smoothly with active monitoring
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
