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

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
  businessAddress?: string;
  businessType?: string;
  approvalStatus: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: any;
}

export const VendorApprovalScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { showNotification } = useNotification();

  // Get initial filter from route params
  const initialFilter = (route.params as any)?.filter || "pending";

  useEffect(() => {
    loadVendors();
    // Set initial filter from route params
    setSelectedFilter(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    filterVendors();
  }, [vendors, selectedFilter]);

  const loadVendors = async () => {
    try {
      const vendorsQuery = query(
        collection(db, "users"),
        where("role", "==", "vendor"),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(vendorsQuery);
      const vendorsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Vendor[];

      setVendors(vendorsData);
    } catch (error) {
      console.error("Error loading vendors:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to load vendors",
      });
    }
  };

  const filterVendors = () => {
    if (selectedFilter === "all") {
      setFilteredVendors(vendors);
    } else {
      setFilteredVendors(
        vendors.filter((vendor) => vendor.approvalStatus === selectedFilter),
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVendors();
    setRefreshing(false);
  };

  const handleApproveVendor = async (vendor: Vendor) => {
    Alert.alert(
      "Approve Vendor",
      `Are you sure you want to approve ${vendor.businessName || vendor.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          style: "default",
          onPress: async () => {
            setProcessing(vendor.id);
            try {
              await updateDoc(doc(db, "users", vendor.id), {
                approvalStatus: "approved",
                approvedAt: new Date(),
                rejectionReason: null,
              });

              showNotification({
                type: "success",
                title: "Vendor Approved",
                message: `${vendor.businessName || vendor.name} has been approved successfully`,
              });

              await loadVendors();
            } catch (error) {
              console.error("Error approving vendor:", error);
              showNotification({
                type: "error",
                title: "Error",
                message: "Failed to approve vendor",
              });
            } finally {
              setProcessing(null);
            }
          },
        },
      ],
    );
  };

  const handleRejectVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const confirmRejectVendor = async () => {
    if (!selectedVendor || !rejectionReason.trim()) {
      showNotification({
        type: "error",
        title: "Error",
        message: "Please provide a reason for rejection",
      });
      return;
    }

    setProcessing(selectedVendor.id);
    try {
      await updateDoc(doc(db, "users", selectedVendor.id), {
        approvalStatus: "rejected",
        rejectionReason: rejectionReason.trim(),
        rejectedAt: new Date(),
      });

      showNotification({
        type: "success",
        title: "Vendor Rejected",
        message: `${selectedVendor.businessName || selectedVendor.name} has been rejected`,
      });

      await loadVendors();
      setShowRejectModal(false);
      setSelectedVendor(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting vendor:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to reject vendor",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteVendor = async (vendor: Vendor) => {
    Alert.alert(
      "Delete Vendor",
      `Are you sure you want to permanently delete ${vendor.businessName || vendor.name}?\n\nThis action cannot be undone and will remove all vendor data.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setProcessing(vendor.id);
            try {
              await deleteDoc(doc(db, "users", vendor.id));

              showNotification({
                type: "success",
                title: "Vendor Deleted",
                message: `${vendor.businessName || vendor.name} has been permanently deleted`,
              });

              await loadVendors();
            } catch (error) {
              console.error("Error deleting vendor:", error);
              showNotification({
                type: "error",
                title: "Error",
                message: "Failed to delete vendor",
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
        colors={["#059669", "#10b981"]}
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
            <Ionicons name="storefront-outline" size={24} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>
              Vendor Management
            </Text>
            <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
              {filteredVendors.length} vendor
              {filteredVendors.length !== 1 ? "s" : ""}{" "}
              {selectedFilter === "all" ? "total" : selectedFilter}
            </Text>
          </View>
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
              {vendors.filter((v) => v.approvalStatus === "pending").length}
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
              {vendors.filter((v) => v.approvalStatus === "approved").length}
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
              {vendors.length}
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
            count={vendors.filter((v) => v.approvalStatus === "pending").length}
          />
          <FilterButton
            filter="approved"
            label="Approved"
            count={
              vendors.filter((v) => v.approvalStatus === "approved").length
            }
          />
          <FilterButton
            filter="rejected"
            label="Rejected"
            count={
              vendors.filter((v) => v.approvalStatus === "rejected").length
            }
          />
          <FilterButton filter="all" label="All" count={vendors.length} />
        </ScrollView>
      </View>

      {/* Vendors List */}
      <ScrollView
        style={{ flex: 1, padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredVendors.length > 0 ? (
          <View style={{ gap: 16 }}>
            {filteredVendors.map((vendor) => (
              <TouchableOpacity
                key={vendor.id}
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
                        getStatusColor(vendor.approvalStatus) + "20",
                      borderRadius: 28,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 16,
                    }}
                  >
                    <Ionicons
                      name="storefront-outline"
                      size={24}
                      color={getStatusColor(vendor.approvalStatus)}
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
                      {vendor.businessName || vendor.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#6b7280",
                        marginBottom: 2,
                      }}
                    >
                      {vendor.email}
                    </Text>
                    {vendor.phone && (
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#6b7280",
                          marginBottom: 2,
                        }}
                      >
                        {vendor.phone}
                      </Text>
                    )}
                    <Text style={{ fontSize: 12, color: "#9ca3af" }}>
                      Applied:{" "}
                      {(() => {
                        try {
                          if (vendor.createdAt?.toDate) {
                            return new Date(
                              vendor.createdAt.toDate(),
                            ).toLocaleDateString();
                          } else if (vendor.createdAt) {
                            return new Date(
                              vendor.createdAt,
                            ).toLocaleDateString();
                          }
                          return "Unknown";
                        } catch (error) {
                          return "Unknown";
                        }
                      })()}
                    </Text>
                  </View>
                  <StatusBadge status={vendor.approvalStatus} />
                </View>

                {vendor.businessAddress && (
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
                      {vendor.businessAddress}
                    </Text>
                  </View>
                )}

                {vendor.businessType && (
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
                      Business Type:
                    </Text>
                    <Text style={{ fontSize: 14, color: "#374151" }}>
                      {vendor.businessType}
                    </Text>
                  </View>
                )}

                {vendor.rejectionReason && (
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
                      {vendor.rejectionReason}
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: "row", gap: 8 }}>
                  {vendor.approvalStatus === "pending" && (
                    <>
                      <TouchableOpacity
                        onPress={() => handleRejectVendor(vendor)}
                        disabled={processing === vendor.id}
                        style={{
                          flex: 1,
                          backgroundColor: "#fee2e2",
                          borderRadius: 8,
                          padding: 12,
                          alignItems: "center",
                          opacity: processing === vendor.id ? 0.5 : 1,
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
                        onPress={() => handleApproveVendor(vendor)}
                        disabled={processing === vendor.id}
                        style={{
                          flex: 1,
                          backgroundColor: "#dcfce7",
                          borderRadius: 8,
                          padding: 12,
                          alignItems: "center",
                          opacity: processing === vendor.id ? 0.5 : 1,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: "#16a34a",
                          }}
                        >
                          {processing === vendor.id
                            ? "Processing..."
                            : "Approve"}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Delete button for all vendors */}
                  <TouchableOpacity
                    onPress={() => handleDeleteVendor(vendor)}
                    disabled={processing === vendor.id}
                    style={{
                      flex: vendor.approvalStatus === "pending" ? 0.5 : 1,
                      backgroundColor: "#fef2f2",
                      borderRadius: 8,
                      padding: 12,
                      alignItems: "center",
                      opacity: processing === vendor.id ? 0.5 : 1,
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
            <Ionicons name="storefront-outline" size={48} color="#9ca3af" />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#1f2937",
                marginTop: 16,
                marginBottom: 8,
              }}
            >
              No {selectedFilter === "all" ? "" : selectedFilter} vendors
            </Text>
            <Text
              style={{ fontSize: 14, color: "#6b7280", textAlign: "center" }}
            >
              {selectedFilter === "pending"
                ? "No pending vendor applications"
                : `No ${selectedFilter} vendors found`}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Reject Vendor Modal */}
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
                Reject Vendor
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
              {selectedVendor?.businessName || selectedVendor?.name}:
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
                onPress={confirmRejectVendor}
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
