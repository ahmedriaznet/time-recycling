import React, { useState, useEffect } from "react";
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
import { db } from "../../config/firebase";
import { useNotification } from "../../contexts/NotificationContext";

interface Driver {
  id: string;
  name: string;
  email: string;
  phone?: string;
  vehicleInfo?: string;
  approvalStatus: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: any;
}

export const DriverApprovalScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { showNotification } = useNotification();

  // Get initial filter from route params
  const initialFilter = (route.params as any)?.filter || "pending";

  useEffect(() => {
    loadDrivers();
    // Set initial filter from route params
    setSelectedFilter(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    filterDrivers();
  }, [drivers, selectedFilter]);

  const loadDrivers = async () => {
    try {
      const driversQuery = query(
        collection(db, "users"),
        where("role", "==", "driver"),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(driversQuery);
      const driversData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Driver[];

      setDrivers(driversData);
    } catch (error) {
      console.error("Error loading drivers:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to load drivers",
      });
    }
  };

  const filterDrivers = () => {
    if (selectedFilter === "all") {
      setFilteredDrivers(drivers);
    } else {
      setFilteredDrivers(
        drivers.filter((driver) => driver.approvalStatus === selectedFilter),
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDrivers();
    setRefreshing(false);
  };

  const handleApproveDriver = async (driver: Driver) => {
    Alert.alert(
      "Approve Driver",
      `Are you sure you want to approve ${driver.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          style: "default",
          onPress: async () => {
            setProcessing(driver.id);
            try {
              await updateDoc(doc(db, "users", driver.id), {
                approvalStatus: "approved",
                approvedAt: new Date(),
                rejectionReason: null,
              });

              showNotification({
                type: "success",
                title: "Driver Approved",
                message: `${driver.name} has been approved successfully`,
              });

              await loadDrivers();
            } catch (error) {
              console.error("Error approving driver:", error);
              showNotification({
                type: "error",
                title: "Error",
                message: "Failed to approve driver",
              });
            } finally {
              setProcessing(null);
            }
          },
        },
      ],
    );
  };

  const handleRejectDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const confirmRejectDriver = async () => {
    if (!selectedDriver || !rejectionReason.trim()) {
      showNotification({
        type: "error",
        title: "Error",
        message: "Please provide a reason for rejection",
      });
      return;
    }

    setProcessing(selectedDriver.id);
    try {
      await updateDoc(doc(db, "users", selectedDriver.id), {
        approvalStatus: "rejected",
        rejectionReason: rejectionReason.trim(),
        rejectedAt: new Date(),
      });

      showNotification({
        type: "success",
        title: "Driver Rejected",
        message: `${selectedDriver.name} has been rejected`,
      });

      setShowRejectModal(false);
      setSelectedDriver(null);
      setRejectionReason("");
      await loadDrivers();
      setShowRejectModal(false);
      setSelectedDriver(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting driver:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to reject driver",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteDriver = async (driver: Driver) => {
    Alert.alert(
      "Delete Driver",
      `Are you sure you want to permanently delete ${driver.name}?\n\nThis action cannot be undone and will remove all driver data.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setProcessing(driver.id);
            try {
              await deleteDoc(doc(db, "users", driver.id));

              showNotification({
                type: "success",
                title: "Driver Deleted",
                message: `${driver.name} has been permanently deleted`,
              });

              await loadDrivers();
            } catch (error) {
              console.error("Error deleting driver:", error);
              showNotification({
                type: "error",
                title: "Error",
                message: "Failed to delete driver",
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
            <Ionicons name="people" size={24} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>
              Driver Approval
            </Text>
            <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
              Manage driver applications
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton
            filter="pending"
            label="Pending"
            count={drivers.filter((d) => d.approvalStatus === "pending").length}
          />
          <FilterButton
            filter="approved"
            label="Approved"
            count={
              drivers.filter((d) => d.approvalStatus === "approved").length
            }
          />
          <FilterButton
            filter="rejected"
            label="Rejected"
            count={
              drivers.filter((d) => d.approvalStatus === "rejected").length
            }
          />
          <FilterButton filter="all" label="All" count={drivers.length} />
        </ScrollView>
      </View>

      {/* Driver List */}
      <ScrollView
        style={{ flex: 1, padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredDrivers.length > 0 ? (
          <View style={{ gap: 12 }}>
            {filteredDrivers.map((driver) => (
              <TouchableOpacity
                key={driver.id}
                onPress={() =>
                  navigation.navigate(
                    "DriverDetails" as never,
                    { driver } as never,
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
                        getStatusColor(driver.approvalStatus) + "20",
                      borderRadius: 28,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 16,
                    }}
                  >
                    <Ionicons
                      name="person-outline"
                      size={24}
                      color={getStatusColor(driver.approvalStatus)}
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
                      {driver.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#6b7280",
                        marginBottom: 2,
                      }}
                    >
                      {driver.email}
                    </Text>
                    {driver.phone && (
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#6b7280",
                          marginBottom: 2,
                        }}
                      >
                        {driver.phone}
                      </Text>
                    )}
                    <Text style={{ fontSize: 12, color: "#9ca3af" }}>
                      Applied:{" "}
                      {(() => {
                        try {
                          if (driver.createdAt?.toDate) {
                            return new Date(
                              driver.createdAt.toDate(),
                            ).toLocaleDateString();
                          } else if (driver.createdAt) {
                            return new Date(
                              driver.createdAt,
                            ).toLocaleDateString();
                          }
                          return "Unknown";
                        } catch (error) {
                          return "Unknown";
                        }
                      })()}
                    </Text>
                  </View>
                  <StatusBadge status={driver.approvalStatus} />
                </View>

                {driver.vehicleInfo && (
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
                      Vehicle Information:
                    </Text>
                    <Text style={{ fontSize: 14, color: "#374151" }}>
                      {driver.vehicleInfo}
                    </Text>
                  </View>
                )}

                {driver.rejectionReason && (
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
                      {driver.rejectionReason}
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: "row", gap: 8 }}>
                  {driver.approvalStatus === "pending" && (
                    <>
                      <TouchableOpacity
                        onPress={() => handleRejectDriver(driver)}
                        disabled={processing === driver.id}
                        style={{
                          flex: 1,
                          backgroundColor: "#fee2e2",
                          borderRadius: 8,
                          padding: 12,
                          alignItems: "center",
                          opacity: processing === driver.id ? 0.5 : 1,
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
                        onPress={() => handleApproveDriver(driver)}
                        disabled={processing === driver.id}
                        style={{
                          flex: 1,
                          backgroundColor: "#dcfce7",
                          borderRadius: 8,
                          padding: 12,
                          alignItems: "center",
                          opacity: processing === driver.id ? 0.5 : 1,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: "#16a34a",
                          }}
                        >
                          {processing === driver.id
                            ? "Processing..."
                            : "Approve"}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Delete button for all drivers */}
                  <TouchableOpacity
                    onPress={() => handleDeleteDriver(driver)}
                    disabled={processing === driver.id}
                    style={{
                      flex: driver.approvalStatus === "pending" ? 0.5 : 1,
                      backgroundColor: "#fef2f2",
                      borderRadius: 8,
                      padding: 12,
                      alignItems: "center",
                      opacity: processing === driver.id ? 0.5 : 1,
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
            <Ionicons name="people-outline" size={48} color="#9ca3af" />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#1f2937",
                marginTop: 16,
                marginBottom: 8,
              }}
            >
              No {selectedFilter === "all" ? "" : selectedFilter} drivers
            </Text>
            <Text
              style={{ fontSize: 14, color: "#6b7280", textAlign: "center" }}
            >
              {selectedFilter === "pending"
                ? "No pending driver applications"
                : `No ${selectedFilter} drivers found`}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Rejection Modal */}
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
              borderRadius: 20,
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
                style={{ fontSize: 20, fontWeight: "bold", color: "#1f2937" }}
              >
                Reject Driver
              </Text>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 16, color: "#374151", marginBottom: 16 }}>
              Please provide a reason for rejecting {selectedDriver?.name}:
            </Text>

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                minHeight: 100,
                textAlignVertical: "top",
                marginBottom: 20,
              }}
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
            />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowRejectModal(false)}
                style={{
                  flex: 1,
                  backgroundColor: "#f3f4f6",
                  borderRadius: 8,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#374151" }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmRejectDriver}
                disabled={
                  !rejectionReason.trim() || processing === selectedDriver?.id
                }
                style={{
                  flex: 1,
                  backgroundColor: "#ef4444",
                  borderRadius: 8,
                  padding: 16,
                  alignItems: "center",
                  opacity:
                    !rejectionReason.trim() || processing === selectedDriver?.id
                      ? 0.5
                      : 1,
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "white" }}
                >
                  {processing === selectedDriver?.id
                    ? "Rejecting..."
                    : "Reject Driver"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
