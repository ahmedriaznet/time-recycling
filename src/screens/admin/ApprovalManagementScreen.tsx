import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
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
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
} from "firebase/firestore";
import { deleteUser, getAuth } from "firebase/auth";
import { db } from "../../config/firebase";
import { useNotification } from "../../contexts/NotificationContext";
import {
  deleteUserCompletely,
  getManualCleanupInstructions,
} from "../../utils/adminUserManagement";

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
  emailVerified: boolean;
  createdAt: any;
}

export const ApprovalManagementScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedTab, setSelectedTab] = useState<"drivers" | "vendors">(
    "drivers",
  );
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { showNotification } = useNotification();

  // Get initial filter from route params
  const initialFilter = (route.params as any)?.filter || "pending";
  const initialTab = (route.params as any)?.tab || "drivers";

  useEffect(() => {
    loadUsers();
    setSelectedFilter(initialFilter);
    setSelectedTab(initialTab);
  }, [initialFilter, initialTab]);

  useEffect(() => {
    filterUsers();
  }, [users, selectedFilter, selectedTab]);

  const loadUsers = async () => {
    try {
      const usersQuery = query(
        collection(db, "users"),
        where("role", "in", ["driver", "vendor"]),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(usersQuery);
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];

      setUsers(usersData);
    } catch (error) {
      console.error("Error loading users:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to load users",
      });
    }
  };

  const filterUsers = () => {
    let filtered = users.filter(
      (user) => user.role === (selectedTab.slice(0, -1) as "driver" | "vendor"),
    );

    if (selectedFilter !== "all") {
      filtered = filtered.filter(
        (user) => user.approvalStatus === selectedFilter,
      );
    }

    setFilteredUsers(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleApproveUser = async (user: User) => {
    const userType = user.role === "driver" ? "Driver" : "Vendor";
    const userName =
      user.role === "vendor" ? user.businessName || user.name : user.name;

    Alert.alert(
      `Approve ${userType}`,
      `Are you sure you want to approve ${userName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          style: "default",
          onPress: async () => {
            setProcessing(user.id);
            try {
              await updateDoc(doc(db, "users", user.id), {
                approvalStatus: "approved",
                approvedAt: new Date(),
                rejectionReason: null,
              });

              showNotification({
                type: "success",
                title: `${userType} Approved`,
                message: `${userName} has been approved successfully. They will need to verify their email to continue.`,
              });

              await loadUsers();
            } catch (error) {
              console.error(`Error approving ${user.role}:`, error);
              showNotification({
                type: "error",
                title: "Error",
                message: `Failed to approve ${user.role}`,
              });
            } finally {
              setProcessing(null);
            }
          },
        },
      ],
    );
  };

  const handleRejectUser = (user: User) => {
    setSelectedUser(user);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const confirmRejectUser = async () => {
    if (!selectedUser || !rejectionReason.trim()) {
      showNotification({
        type: "error",
        title: "Error",
        message: "Please provide a reason for rejection",
      });
      return;
    }

    setProcessing(selectedUser.id);
    try {
      await updateDoc(doc(db, "users", selectedUser.id), {
        approvalStatus: "rejected",
        rejectionReason: rejectionReason.trim(),
        rejectedAt: new Date(),
      });

      const userType = selectedUser.role === "driver" ? "Driver" : "Vendor";
      const userName =
        selectedUser.role === "vendor"
          ? selectedUser.businessName || selectedUser.name
          : selectedUser.name;

      showNotification({
        type: "success",
        title: `${userType} Rejected`,
        message: `${userName} has been rejected`,
      });

      await loadUsers();
      setShowRejectModal(false);
      setSelectedUser(null);
      setRejectionReason("");
    } catch (error) {
      console.error(`Error rejecting ${selectedUser.role}:`, error);
      showNotification({
        type: "error",
        title: "Error",
        message: `Failed to reject ${selectedUser.role}`,
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteUser = async (user: User) => {
    const userType = user.role === "driver" ? "Driver" : "Vendor";
    const userName =
      user.role === "vendor" ? user.businessName || user.name : user.name;

    Alert.alert(
      `Delete ${userType}`,
      `Are you sure you want to permanently delete ${userName}?\n\nThis will remove all ${user.role} data and allow them to sign up again with the same email.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setProcessing(user.id);
            try {
              const deleteResult = await deleteUserCompletely(
                user.id,
                user.email,
              );

              if (deleteResult.firestoreDeleted) {
                if (deleteResult.requiresManualCleanup) {
                  // Show detailed instructions
                  console.log(getManualCleanupInstructions(user.email));

                  Alert.alert(
                    "User Deleted - Action Required",
                    `${userName} deleted from database.\n\nTo allow them to sign up again:\n\n1. Go to Firebase Console\n2. Authentication → Users\n3. Delete: ${user.email}\n\nOr ask them to use "Forgot Password" instead.`,
                    [{ text: "OK" }],
                  );

                  showNotification({
                    type: "success",
                    title: `${userType} Deleted`,
                    message: `${userName} removed. Check console for Firebase Auth cleanup instructions.`,
                  });
                } else {
                  showNotification({
                    type: "success",
                    title: `${userType} Deleted`,
                    message: `${userName} completely removed. They can sign up again.`,
                  });
                }

                await loadUsers();
              } else {
                throw new Error(deleteResult.message);
              }
            } catch (error) {
              console.error(`Error deleting ${user.role}:`, error);
              showNotification({
                type: "error",
                title: "Error",
                message: `Failed to delete ${user.role}`,
              });
            } finally {
              setProcessing(null);
            }
          },
        },
      ],
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#f59e0b";
      case "approved":
        return "#22c55e";
      case "rejected":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getTabStats = useMemo(() => {
    return (role: "driver" | "vendor") => {
      const filtered = users.filter((user) => user.role === role);
      return {
        total: filtered.length,
        pending: filtered.filter((u) => u.approvalStatus === "pending").length,
        approved: filtered.filter((u) => u.approvalStatus === "approved")
          .length,
        rejected: filtered.filter((u) => u.approvalStatus === "rejected")
          .length,
      };
    };
  }, [users]);

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        backgroundColor: getStatusColor(status) + "20",
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: getStatusColor(status),
          textTransform: "uppercase",
        }}
      >
        {status}
      </Text>
    </View>
  );

  const FilterButton: React.FC<{
    filter: typeof selectedFilter;
    label: string;
    count: number;
  }> = ({ filter, label, count }) => (
    <TouchableOpacity
      onPress={() => setSelectedFilter(filter)}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: selectedFilter === filter ? "#3b82f6" : "#f3f4f6",
        marginRight: 12,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: selectedFilter === filter ? "white" : "#374151",
        }}
      >
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  const currentStats = useMemo(() => {
    return getTabStats(selectedTab.slice(0, -1) as "driver" | "vendor");
  }, [getTabStats, selectedTab]);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <LinearGradient
        colors={
          selectedTab === "drivers"
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
                selectedTab === "drivers" ? "car-outline" : "storefront-outline"
              }
              size={24}
              color="white"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>
              User Management
            </Text>
            <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
              {filteredUsers.length} {selectedTab}{" "}
              {selectedFilter === "all" ? "total" : selectedFilter}
            </Text>
          </View>
        </View>

        {/* Tab Selector */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 12,
            padding: 4,
            marginBottom: 20,
          }}
        >
          <TouchableOpacity
            onPress={() => setSelectedTab("drivers")}
            style={{
              flex: 1,
              backgroundColor:
                selectedTab === "drivers"
                  ? "rgba(255,255,255,0.3)"
                  : "transparent",
              borderRadius: 8,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "white",
                fontWeight: selectedTab === "drivers" ? "bold" : "600",
                fontSize: 16,
              }}
            >
              🚗 Drivers (
              {useMemo(() => getTabStats("driver").total, [getTabStats])})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedTab("vendors")}
            style={{
              flex: 1,
              backgroundColor:
                selectedTab === "vendors"
                  ? "rgba(255,255,255,0.3)"
                  : "transparent",
              borderRadius: 8,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "white",
                fontWeight: selectedTab === "vendors" ? "bold" : "600",
                fontSize: 16,
              }}
            >
              🏪 Vendors (
              {useMemo(() => getTabStats("vendor").total, [getTabStats])})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
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
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "white" }}>
              {currentStats.pending}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
              Pending
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
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "white" }}>
              {currentStats.approved}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
              Approved
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
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "white" }}>
              {currentStats.total}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
              Total
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filter Buttons */}
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton
            filter="pending"
            label="Pending"
            count={currentStats.pending}
          />
          <FilterButton
            filter="approved"
            label="Approved"
            count={currentStats.approved}
          />
          <FilterButton
            filter="rejected"
            label="Rejected"
            count={currentStats.rejected}
          />
          <FilterButton filter="all" label="All" count={currentStats.total} />
        </ScrollView>
      </View>

      {/* Users List */}
      <ScrollView
        style={{ flex: 1, padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredUsers.length > 0 ? (
          <View style={{ gap: 16 }}>
            {filteredUsers.map((user) => (
              <TouchableOpacity
                key={user.id}
                onPress={() =>
                  navigation.navigate(
                    "UserDetail" as never,
                    {
                      userId: user.id,
                      userRole: user.role,
                    } as never,
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
                    alignItems: "start",
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      backgroundColor:
                        getStatusColor(user.approvalStatus) + "20",
                      borderRadius: 28,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 16,
                    }}
                  >
                    <Ionicons
                      name={
                        user.role === "driver"
                          ? "car-outline"
                          : "storefront-outline"
                      }
                      size={24}
                      color={getStatusColor(user.approvalStatus)}
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
                      {user.role === "vendor"
                        ? user.businessName || user.name
                        : user.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#6b7280",
                        marginBottom: 2,
                      }}
                    >
                      {user.email}
                    </Text>
                    {user.phone && (
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#6b7280",
                          marginBottom: 2,
                        }}
                      >
                        {user.phone}
                      </Text>
                    )}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 2,
                      }}
                    >
                      <Ionicons
                        name={
                          user.emailVerified
                            ? "checkmark-circle"
                            : "alert-circle"
                        }
                        size={14}
                        color={user.emailVerified ? "#10b981" : "#f59e0b"}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          color: user.emailVerified ? "#10b981" : "#f59e0b",
                          marginLeft: 4,
                        }}
                      >
                        Email {user.emailVerified ? "Verified" : "Not Verified"}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: "#9ca3af" }}>
                      Applied:{" "}
                      {(() => {
                        try {
                          if (user.createdAt?.toDate) {
                            return new Date(
                              user.createdAt.toDate(),
                            ).toLocaleDateString();
                          } else if (user.createdAt) {
                            return new Date(
                              user.createdAt,
                            ).toLocaleDateString();
                          }
                          return "Unknown";
                        } catch (error) {
                          return "Unknown";
                        }
                      })()}
                    </Text>
                  </View>
                  <StatusBadge status={user.approvalStatus} />
                </View>

                {/* Role-specific information */}
                {user.role === "vendor" && user.businessAddress && (
                  <View
                    style={{
                      backgroundColor: "#f9fafb",
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        marginBottom: 4,
                      }}
                    >
                      Business Address:
                    </Text>
                    <Text style={{ fontSize: 14, color: "#374151" }}>
                      {user.businessAddress}
                    </Text>
                  </View>
                )}

                {user.role === "driver" && user.vehicleInfo && (
                  <View
                    style={{
                      backgroundColor: "#f0f9ff",
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#0369a1",
                        marginBottom: 4,
                      }}
                    >
                      Vehicle Information:
                    </Text>
                    <Text style={{ fontSize: 14, color: "#374151" }}>
                      {user.vehicleInfo}
                    </Text>
                  </View>
                )}

                {user.rejectionReason && (
                  <View
                    style={{
                      backgroundColor: "#fef2f2",
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#dc2626",
                        marginBottom: 4,
                      }}
                    >
                      Rejection Reason:
                    </Text>
                    <Text style={{ fontSize: 14, color: "#374151" }}>
                      {user.rejectionReason}
                    </Text>
                  </View>
                )}

                {/* View Details Button */}
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate(
                      "UserDetail" as never,
                      {
                        userId: user.id,
                        userRole: user.role,
                      } as never,
                    )
                  }
                  style={{
                    backgroundColor: "#f0f9ff",
                    borderRadius: 8,
                    padding: 12,
                    alignItems: "center",
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: "#3b82f6",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#3b82f6",
                    }}
                  >
                    📋 View Pickup History
                  </Text>
                </TouchableOpacity>

                {/* Action Buttons */}
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {user.approvalStatus === "pending" && (
                    <>
                      <TouchableOpacity
                        onPress={() => handleRejectUser(user)}
                        disabled={processing === user.id}
                        style={{
                          flex: 1,
                          backgroundColor: "#fee2e2",
                          borderRadius: 8,
                          padding: 12,
                          alignItems: "center",
                          opacity: processing === user.id ? 0.5 : 1,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: "#dc2626",
                          }}
                        >
                          Reject
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleApproveUser(user)}
                        disabled={processing === user.id}
                        style={{
                          flex: 1,
                          backgroundColor: "#dcfce7",
                          borderRadius: 8,
                          padding: 12,
                          alignItems: "center",
                          opacity: processing === user.id ? 0.5 : 1,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: "#16a34a",
                          }}
                        >
                          {processing === user.id ? "Processing..." : "Approve"}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Delete button for all users */}
                  <TouchableOpacity
                    onPress={() => handleDeleteUser(user)}
                    disabled={processing === user.id}
                    style={{
                      flex: user.approvalStatus === "pending" ? 0.5 : 1,
                      backgroundColor: "#fef2f2",
                      borderRadius: 8,
                      padding: 12,
                      alignItems: "center",
                      opacity: processing === user.id ? 0.5 : 1,
                      borderWidth: 1,
                      borderColor: "#ef4444",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#dc2626",
                      }}
                    >
                      Delete
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
            <Ionicons
              name={
                selectedTab === "drivers" ? "car-outline" : "storefront-outline"
              }
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
              No {selectedFilter === "all" ? "" : selectedFilter} {selectedTab}
            </Text>
            <Text
              style={{ fontSize: 14, color: "#6b7280", textAlign: "center" }}
            >
              {selectedFilter === "pending"
                ? `No pending ${selectedTab} applications`
                : `No ${selectedFilter} ${selectedTab} found`}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Reject User Modal */}
      <Modal visible={showRejectModal} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 24,
              width: "100%",
              maxWidth: 400,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                Reject {selectedUser?.role === "driver" ? "Driver" : "Vendor"}
              </Text>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text
              style={{
                fontSize: 16,
                color: "#374151",
                marginBottom: 16,
              }}
            >
              Please provide a reason for rejecting{" "}
              {selectedUser?.role === "vendor"
                ? selectedUser?.businessName || selectedUser?.name
                : selectedUser?.name}
              :
            </Text>

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                textAlignVertical: "top",
                minHeight: 100,
                marginBottom: 20,
              }}
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
            />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowRejectModal(false)}
                style={{
                  flex: 1,
                  backgroundColor: "#f3f4f6",
                  borderRadius: 8,
                  padding: 14,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmRejectUser}
                disabled={!rejectionReason.trim()}
                style={{
                  flex: 1,
                  backgroundColor: rejectionReason.trim()
                    ? "#dc2626"
                    : "#d1d5db",
                  borderRadius: 8,
                  padding: 14,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "white",
                  }}
                >
                  Reject
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
