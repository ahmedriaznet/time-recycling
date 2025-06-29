import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  CommonActions,
} from "@react-navigation/native";
import { useFirebasePickupStore } from "../../contexts/FirebasePickupStore";
import { useNotification } from "../../contexts/NotificationContext";

export const CancelPickupScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { showNotification } = useNotification();
  const { cancelPickup } = useFirebasePickupStore();
  const pickup = (route.params as any)?.pickup;

  const [cancelReason, setCancelReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!pickup) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#f8fafc",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 18, color: "#6b7280" }}>Pickup not found</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            marginTop: 16,
            padding: 12,
            backgroundColor: "#3b82f6",
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      Alert.alert("Error", "Please provide a reason for cancellation.");
      return;
    }

    // Check 24-hour restriction
    try {
      let pickupDate;

      // Handle different date formats
      if (
        pickup.scheduledDate &&
        typeof pickup.scheduledDate.toDate === "function"
      ) {
        pickupDate = pickup.scheduledDate.toDate();
      } else if (pickup.scheduledDate && pickup.scheduledDate.seconds) {
        pickupDate = new Date(pickup.scheduledDate.seconds * 1000);
      } else {
        pickupDate = new Date(pickup.scheduledDate);
      }

      const now = new Date();
      const hoursUntilPickup =
        (pickupDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilPickup < 24) {
        const hours = Math.max(0, Math.floor(hoursUntilPickup));
        const minutes = Math.max(0, Math.floor((hoursUntilPickup % 1) * 60));

        Alert.alert(
          "Cannot Cancel",
          `Pickup is scheduled in ${hours} hours and ${minutes} minutes. Cancellations must be made at least 24 hours in advance.`,
          [{ text: "OK" }],
        );
        return;
      }
    } catch (error) {
      console.error("Error checking cancellation time:", error);
      Alert.alert(
        "Error",
        "Unable to verify pickup time. Please contact support.",
      );
      return;
    }

    Alert.alert(
      "Cancel Pickup",
      `Are you sure you want to cancel this pickup?\n\nReason: ${cancelReason.trim()}`,
      [
        { text: "Keep Pickup", style: "cancel" },
        {
          text: "Cancel Pickup",
          style: "destructive",
          onPress: handleConfirmCancel,
        },
      ],
    );
  };

  const handleConfirmCancel = async () => {
    setIsLoading(true);

    try {
      console.log("🚀 Starting cancellation process...");

      await cancelPickup(pickup.id, cancelReason.trim());

      console.log("✅ Cancellation completed, showing success message");

      showNotification({
        type: "success",
        title: "Pickup Cancelled",
        message: "The pickup has been cancelled successfully.",
      });

      // Reset navigation stack and go to Dashboard
      setTimeout(() => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "DashboardTab" }],
          }),
        );
      }, 500);
    } catch (error: any) {
      console.error("❌ Cancellation error:", error);
      setIsLoading(false);

      showNotification({
        type: "error",
        title: "Cancellation Failed",
        message: error.message || "Failed to cancel pickup. Please try again.",
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <LinearGradient
        colors={["#ef4444", "#dc2626"]}
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
            disabled={isLoading}
            style={{ marginRight: 16, opacity: isLoading ? 0.5 : 1 }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>
            Cancel Pickup
          </Text>
        </View>

        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "white",
              marginBottom: 8,
            }}
          >
            {pickup.vendorName || pickup.vendorBusinessName || "Vendor"}
          </Text>
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
            📍 {pickup.address || "Address not available"}
          </Text>
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
            🍾 {pickup.bottleCount} bottles
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1, padding: 20 }}>
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: 16,
            }}
          >
            Cancellation Reason
          </Text>

          <TextInput
            value={cancelReason}
            onChangeText={setCancelReason}
            placeholder="Please provide a reason for cancelling this pickup..."
            multiline
            numberOfLines={4}
            editable={!isLoading}
            style={{
              borderWidth: 1,
              borderColor: "#d1d5db",
              borderRadius: 12,
              padding: 16,
              fontSize: 16,
              textAlignVertical: "top",
              backgroundColor: isLoading ? "#f9fafb" : "white",
            }}
          />
        </View>

        <View
          style={{
            backgroundColor: "#fef2f2",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            borderLeftWidth: 4,
            borderLeftColor: "#ef4444",
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#991b1b",
              marginBottom: 8,
            }}
          >
            ⚠️ Important Notice
          </Text>
          <Text style={{ fontSize: 14, color: "#7f1d1d", lineHeight: 20 }}>
            Cancelling this pickup will make it available for other drivers to
            accept. The vendor will be notified of the cancellation.
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleCancel}
          disabled={isLoading || !cancelReason.trim()}
          style={{
            backgroundColor:
              isLoading || !cancelReason.trim() ? "#9ca3af" : "#ef4444",
            borderRadius: 16,
            padding: 18,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          {isLoading ? (
            <>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderWidth: 2,
                  borderColor: "rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                  borderRadius: 10,
                  marginRight: 12,
                }}
              />
              <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>
                Cancelling...
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="close-circle-outline"
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
              <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>
                Cancel Pickup
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};
