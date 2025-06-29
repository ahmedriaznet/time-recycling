import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useFirebasePickupStore } from "../../contexts/FirebasePickupStore";
import { useUnifiedAuth } from "../../hooks/useUnifiedAuth";
import { useNotification } from "../../contexts/NotificationContext";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";

export const AvailablePickupsScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [hideHiddenPickups, setHideHiddenPickups] = useState(true);
  const [isDriverAvailable, setIsDriverAvailable] = useState(true);
  const navigation = useNavigation();
  const { user } = useUnifiedAuth();
  const { showNotification } = useNotification();
  const {
    getAvailablePickups,
    getAllAvailablePickups,
    acceptPickup,
    hidePickup,
    unhidePickup,
  } = useFirebasePickupStore();

  // Check if driver is available - if not, show empty list
  const allAvailablePickups = hideHiddenPickups
    ? getAvailablePickups(user?.uid || "") // Filter out hidden pickups
    : getAllAvailablePickups(user?.uid || ""); // Show all pickups including hidden

  // If driver is not available, show empty list
  const availablePickups = isDriverAvailable ? allAvailablePickups : [];

  // Load driver availability status with real-time listener
  React.useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          setIsDriverAvailable(userData.isAvailable !== false); // Default to true
        }
      },
      (error) => {
        console.error("Error listening to availability:", error);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);
  // Calculate how many pickups are hidden by this driver
  const allPickups = getAllAvailablePickups(user?.uid || "");
  const visiblePickups = getAvailablePickups(user?.uid || "");
  const hiddenPickupsCount = allPickups.length - visiblePickups.length;

  const onRefresh = async () => {
    setRefreshing(true);

    // Manually reload availability status
    if (user?.uid) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsDriverAvailable(userData.isAvailable !== false);
        }
      } catch (error) {
        console.error("Error refreshing availability:", error);
      }
    }

    // The real-time listener will automatically update the pickup data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAcceptPickup = async (pickup: any) => {
    Alert.alert(
      "Accept Pickup",
      `Are you sure you want to accept this pickup?\n\n📍 ${pickup.address}\n🍾 ${pickup.bottleCount} bottles\n📅 ${formatDateTime(pickup.scheduledDate)}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          style: "default",
          onPress: async () => {
            try {
              setAccepting(true);
              await acceptPickup(pickup.id, user?.uid || "", user?.name || "");

              showNotification({
                type: "success",
                title: "Pickup Accepted!",
                message:
                  "The vendor has been notified. Check your assigned pickups.",
              });

              setShowDetailsModal(false);
            } catch (error: any) {
              showNotification({
                type: "error",
                title: "Failed to Accept",
                message: error.message || "Failed to accept pickup",
              });
            } finally {
              setAccepting(false);
            }
          },
        },
      ],
    );
  };

  const handleHidePickup = async (pickup: any) => {
    try {
      await hidePickup(pickup.id, user?.uid || "");
      showNotification({
        type: "success",
        title: "Pickup Hidden",
        message: "Pickup has been hidden from your list",
      });
    } catch (error) {
      console.error("Error hiding pickup:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to hide pickup",
      });
    }
  };

  const handleUnhidePickup = async (pickup: any) => {
    try {
      await unhidePickup(pickup.id, user?.uid || "");
      showNotification({
        type: "success",
        title: "Pickup Unhidden",
        message: "Pickup is now visible in your available list",
      });
    } catch (error) {
      console.error("Error unhiding pickup:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to unhide pickup",
      });
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getUrgencyColor = (urgent: boolean) => (urgent ? "#f59e0b" : "#3b82f6");

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
            <Ionicons name="cube-outline" size={24} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>
              Available Pickups
            </Text>
            <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
              {availablePickups.length} pickup
              {availablePickups.length !== 1 ? "s" : ""} available
            </Text>
          </View>
          {hiddenPickupsCount > 0 && (
            <TouchableOpacity
              onPress={() => setHideHiddenPickups(!hideHiddenPickups)}
              style={{
                backgroundColor: hideHiddenPickups
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(255,255,255,0.3)",
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 6,
                marginRight: 8,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.3)",
              }}
            >
              <Text style={{ fontSize: 12, color: "white", fontWeight: "600" }}>
                {hideHiddenPickups
                  ? `Show Hidden (${hiddenPickupsCount})`
                  : "Show Available"}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate("MyPickupsTab" as never)}
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginRight: 8,
            }}
          >
            <Text style={{ fontSize: 12, color: "white", fontWeight: "600" }}>
              My Pickups
            </Text>
          </TouchableOpacity>
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
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "white" }}>
              {availablePickups.filter((p) => p.urgentPickup).length}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
              Urgent
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
              {availablePickups.reduce((sum, p) => sum + p.bottleCount, 0)}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
              Total Bottles
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Pickup List */}
      <ScrollView
        style={{ flex: 1, padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {availablePickups.length > 0 ? (
          <View style={{ gap: 16 }}>
            {availablePickups.map((pickup) => (
              <TouchableOpacity
                key={pickup.id}
                onPress={() => {
                  setSelectedPickup(pickup);
                  setShowDetailsModal(true);
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
                  borderLeftWidth: 4,
                  borderLeftColor: getUrgencyColor(pickup.urgentPickup),
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "bold",
                          color: "#1f2937",
                          flex: 1,
                        }}
                      >
                        {pickup.vendorBusinessName ||
                          pickup.vendorName ||
                          "Vendor Pickup"}
                      </Text>
                      {pickup.hiddenByDrivers?.includes(user?.uid || "") && (
                        <View
                          style={{
                            backgroundColor: "#fef3c7",
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 4,
                            borderWidth: 1,
                            borderColor: "#f59e0b",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              color: "#d97706",
                              fontWeight: "600",
                            }}
                          >
                            HIDDEN
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#6b7280",
                        marginBottom: 2,
                      }}
                    >
                      📍 {pickup.address}
                    </Text>
                    <Text style={{ fontSize: 14, color: "#6b7280" }}>
                      📅 {formatDateTime(pickup.scheduledDate)}
                    </Text>
                  </View>
                  {pickup.urgentPickup && (
                    <View
                      style={{
                        backgroundColor: "#fef3c7",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                        alignSelf: "flex-start",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "600",
                          color: "#92400e",
                        }}
                      >
                        URGENT
                      </Text>
                    </View>
                  )}
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#f3f4f6",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      marginRight: 12,
                    }}
                  >
                    <Ionicons
                      name="wine-outline"
                      size={16}
                      color="#6b7280"
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#374151",
                        fontWeight: "600",
                      }}
                    >
                      {pickup.bottleCount} bottles
                    </Text>
                  </View>

                  {pickup.contactPhone && (
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#eff6ff",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                      }}
                    >
                      <Ionicons
                        name="call-outline"
                        size={16}
                        color="#3b82f6"
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#3b82f6",
                          fontWeight: "600",
                        }}
                      >
                        Contact
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {pickup.notes && (
                  <View
                    style={{
                      backgroundColor: "#f9fafb",
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 12,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: "#374151" }}>
                      💬 {pickup.notes}
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    onPress={() =>
                      pickup.hiddenByDrivers?.includes(user?.uid || "")
                        ? handleUnhidePickup(pickup)
                        : handleHidePickup(pickup)
                    }
                    style={{
                      flex: 1,
                      backgroundColor: pickup.hiddenByDrivers?.includes(
                        user?.uid || "",
                      )
                        ? "#dbeafe"
                        : "#f3f4f6",
                      borderRadius: 8,
                      padding: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: pickup.hiddenByDrivers?.includes(user?.uid || "")
                          ? "#2563eb"
                          : "#374151",
                      }}
                    >
                      {pickup.hiddenByDrivers?.includes(user?.uid || "")
                        ? "Unhide"
                        : "Hide"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleAcceptPickup(pickup)}
                    style={{
                      flex: 2,
                      backgroundColor: "#22c55e",
                      borderRadius: 8,
                      padding: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "white",
                      }}
                    >
                      Accept Pickup
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
              name={isDriverAvailable ? "cube-outline" : "pause-circle-outline"}
              size={48}
              color={isDriverAvailable ? "#9ca3af" : "#f59e0b"}
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
              {isDriverAvailable
                ? "No Available Pickups"
                : "Currently Unavailable"}
            </Text>
            <Text
              style={{ fontSize: 14, color: "#6b7280", textAlign: "center" }}
            >
              {isDriverAvailable
                ? "All pickups are either assigned or you've hidden them. Check back later for new requests."
                : "You're currently set as unavailable. Enable availability in your profile to start receiving pickup assignments."}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Pickup Details Modal */}
      <Modal visible={showDetailsModal} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 24,
              maxHeight: "80%",
            }}
          >
            {selectedPickup && (
              <>
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
                    Pickup Details
                  </Text>
                  <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                    <Ionicons name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={{ gap: 16 }}>
                    <View>
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#6b7280",
                          marginBottom: 4,
                        }}
                      >
                        VENDOR
                      </Text>
                      <Text
                        style={{
                          fontSize: 16,
                          color: "#1f2937",
                          fontWeight: "600",
                        }}
                      >
                        {selectedPickup.vendorBusinessName ||
                          selectedPickup.vendorName ||
                          "Unknown Vendor"}
                      </Text>
                    </View>

                    <View>
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#6b7280",
                          marginBottom: 4,
                        }}
                      >
                        ADDRESS
                      </Text>
                      <Text
                        style={{
                          fontSize: 16,
                          color: "#1f2937",
                          fontWeight: "500",
                        }}
                      >
                        {selectedPickup.address}
                      </Text>
                    </View>

                    <View style={{ flexDirection: "row", gap: 16 }}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#6b7280",
                            marginBottom: 4,
                          }}
                        >
                          BOTTLES
                        </Text>
                        <Text
                          style={{
                            fontSize: 16,
                            color: "#1f2937",
                            fontWeight: "600",
                          }}
                        >
                          {selectedPickup.bottleCount}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#6b7280",
                            marginBottom: 4,
                          }}
                        >
                          SCHEDULED
                        </Text>
                        <Text
                          style={{
                            fontSize: 16,
                            color: "#1f2937",
                            fontWeight: "600",
                          }}
                        >
                          {formatDateTime(selectedPickup.scheduledDate)}
                        </Text>
                      </View>
                    </View>

                    {selectedPickup.contactPhone && (
                      <View>
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#6b7280",
                            marginBottom: 4,
                          }}
                        >
                          CONTACT
                        </Text>
                        <Text
                          style={{
                            fontSize: 16,
                            color: "#1f2937",
                            fontWeight: "500",
                          }}
                        >
                          {selectedPickup.contactPhone}
                        </Text>
                      </View>
                    )}

                    {selectedPickup.notes && (
                      <View>
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#6b7280",
                            marginBottom: 4,
                          }}
                        >
                          NOTES
                        </Text>
                        <Text
                          style={{
                            fontSize: 16,
                            color: "#1f2937",
                            lineHeight: 24,
                          }}
                        >
                          {selectedPickup.notes}
                        </Text>
                      </View>
                    )}

                    {selectedPickup.urgentPickup && (
                      <View
                        style={{
                          backgroundColor: "#fef3c7",
                          borderRadius: 8,
                          padding: 12,
                          borderWidth: 1,
                          borderColor: "#fbbf24",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#92400e",
                            fontWeight: "600",
                          }}
                        >
                          ⚡ URGENT PICKUP - Higher priority, +$5 fee for vendor
                        </Text>
                      </View>
                    )}
                  </View>
                </ScrollView>

                <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
                  <TouchableOpacity
                    onPress={() =>
                      selectedPickup.hiddenByDrivers?.includes(user?.uid || "")
                        ? handleUnhidePickup(selectedPickup)
                        : handleHidePickup(selectedPickup)
                    }
                    style={{
                      flex: 1,
                      backgroundColor: selectedPickup.hiddenByDrivers?.includes(
                        user?.uid || "",
                      )
                        ? "#dbeafe"
                        : "#f3f4f6",
                      borderRadius: 12,
                      padding: 16,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: selectedPickup.hiddenByDrivers?.includes(
                          user?.uid || "",
                        )
                          ? "#2563eb"
                          : "#374151",
                      }}
                    >
                      {selectedPickup.hiddenByDrivers?.includes(user?.uid || "")
                        ? "Unhide"
                        : "Hide"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleAcceptPickup(selectedPickup)}
                    disabled={accepting}
                    style={{
                      flex: 2,
                      backgroundColor: accepting ? "#9ca3af" : "#22c55e",
                      borderRadius: 12,
                      padding: 16,
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
                      {accepting ? "Accepting..." : "Accept Pickup"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
