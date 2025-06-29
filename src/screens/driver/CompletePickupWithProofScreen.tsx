import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useFirebasePickupStore } from "../../contexts/FirebasePickupStore";
import { useNotification } from "../../contexts/NotificationContext";

const { width } = Dimensions.get("window");

export const CompletePickupWithProofScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { showNotification } = useNotification();
  const { completePickup } = useFirebasePickupStore();
  const pickup = (route.params as any)?.pickup;

  const [actualBottleCount, setActualBottleCount] = useState(
    pickup?.bottleCount?.toString() || "",
  );
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Check if pickup can be completed (only on or after pickup date)
  const canCompletePickup = () => {
    if (!pickup?.scheduledDate) return false;

    const pickupDate = new Date(pickup.scheduledDate);
    const now = new Date();

    // Allow completion from the pickup date onwards (ignoring time for simplicity)
    const pickupDateOnly = new Date(
      pickupDate.getFullYear(),
      pickupDate.getMonth(),
      pickupDate.getDate(),
    );
    const todayOnly = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    return todayOnly >= pickupDateOnly;
  };

  const getTimeUntilPickup = () => {
    if (!pickup?.scheduledDate) return "";

    const pickupDate = new Date(pickup.scheduledDate);
    const now = new Date();

    if (pickupDate <= now) return "";

    const diffTime = pickupDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "tomorrow";
    if (diffDays < 7) return `in ${diffDays} days`;
    return `on ${pickupDate.toLocaleDateString()}`;
  };

  if (!pickup) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Text>Pickup not found</Text>
      </SafeAreaView>
    );
  }

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera Permission Required",
        "Please allow camera access to take proof photos.",
        [{ text: "OK" }],
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setProofPhoto(result.assets[0].uri);
        setShowPhotoModal(false);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const selectFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setProofPhoto(result.assets[0].uri);
        setShowPhotoModal(false);
      }
    } catch (error) {
      console.error("Error selecting photo:", error);
      Alert.alert("Error", "Failed to select photo. Please try again.");
    }
  };

  const handleCompletePickup = async () => {
    if (!canCompletePickup()) {
      const timeUntil = getTimeUntilPickup();
      Alert.alert(
        "Cannot Complete Yet",
        `This pickup can only be completed on or after the scheduled date.\n\nScheduled: ${formatDateTime(pickup.scheduledDate)}\n${timeUntil ? `Available ${timeUntil}` : ""}`,
      );
      return;
    }

    if (!actualBottleCount || parseInt(actualBottleCount) < 1) {
      Alert.alert("Error", "Please enter a valid bottle count.");
      return;
    }

    if (!proofPhoto) {
      Alert.alert(
        "Error",
        "Please take a proof photo before completing the pickup.",
      );
      return;
    }

    Alert.alert(
      "Complete Pickup",
      `Are you sure you want to mark this pickup as completed?\n\nBottles collected: ${actualBottleCount}\nProof photo: Attached`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          style: "default",
          onPress: async () => {
            try {
              setCompleting(true);

              await completePickup(
                pickup.id,
                parseInt(actualBottleCount),
                proofPhoto,
              );

              showNotification({
                type: "success",
                title: "Pickup Completed!",
                message: "The vendor has been notified. Great job!",
              });

              // Navigate back to dashboard
              navigation.navigate("DashboardTab" as never);
            } catch (error: any) {
              showNotification({
                type: "error",
                title: "Failed to Complete",
                message: error.message || "Failed to complete pickup",
              });
            } finally {
              setCompleting(false);
            }
          },
        },
      ],
    );
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <LinearGradient
        colors={["#22c55e", "#16a34a"]}
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
            style={{ marginRight: 16 }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
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
            <Ionicons name="checkmark-circle-outline" size={24} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>
              Complete Pickup
            </Text>
            <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
              Add proof and finish
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1, padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Pickup Info Card */}
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
            Pickup Information
          </Text>

          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row" }}>
              <Text style={{ fontSize: 14, color: "#6b7280", width: 120 }}>
                Vendor:
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#1f2937",
                  fontWeight: "500",
                  flex: 1,
                }}
              >
                {pickup.vendorBusinessName ||
                  pickup.vendorName ||
                  "Unknown Vendor"}
              </Text>
            </View>

            <View style={{ flexDirection: "row" }}>
              <Text style={{ fontSize: 14, color: "#6b7280", width: 120 }}>
                Address:
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#1f2937",
                  fontWeight: "500",
                  flex: 1,
                }}
              >
                {pickup.address}
              </Text>
            </View>

            <View style={{ flexDirection: "row" }}>
              <Text style={{ fontSize: 14, color: "#6b7280", width: 120 }}>
                Scheduled:
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#1f2937",
                  fontWeight: "500",
                  flex: 1,
                }}
              >
                {formatDateTime(pickup.scheduledDate)}
              </Text>
            </View>

            <View style={{ flexDirection: "row" }}>
              <Text style={{ fontSize: 14, color: "#6b7280", width: 120 }}>
                Expected:
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#1f2937",
                  fontWeight: "500",
                  flex: 1,
                }}
              >
                {pickup.bottleCount} bottles
              </Text>
            </View>
          </View>
        </View>

        {/* Actual Bottle Count */}
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
            Actual Count
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#d1d5db",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: "#f9fafb",
            }}
          >
            <Ionicons
              name="wine-outline"
              size={20}
              color="#6b7280"
              style={{ marginRight: 12 }}
            />
            <TextInput
              style={{ flex: 1, fontSize: 16, color: "#1f2937" }}
              placeholder="Enter actual bottle count"
              value={actualBottleCount}
              onChangeText={setActualBottleCount}
              keyboardType="numeric"
            />
          </View>

          <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
            Count the actual number of bottles collected
          </Text>
        </View>

        {/* Proof Photo */}
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
            Proof Photo *
          </Text>

          {proofPhoto ? (
            <View>
              <Image
                source={{ uri: proofPhoto }}
                style={{
                  width: "100%",
                  height: 200,
                  borderRadius: 12,
                  marginBottom: 12,
                }}
                resizeMode="cover"
              />
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setShowPhotoModal(true)}
                  style={{
                    flex: 1,
                    backgroundColor: "#f3f4f6",
                    borderRadius: 8,
                    padding: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    Retake Photo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setProofPhoto(null)}
                  style={{
                    flex: 1,
                    backgroundColor: "#fee2e2",
                    borderRadius: 8,
                    padding: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#dc2626",
                    }}
                  >
                    Remove Photo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowPhotoModal(true)}
              style={{
                borderWidth: 2,
                borderColor: "#d1d5db",
                borderStyle: "dashed",
                borderRadius: 12,
                padding: 32,
                alignItems: "center",
                backgroundColor: "#f9fafb",
              }}
            >
              <Ionicons name="camera-outline" size={48} color="#9ca3af" />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#374151",
                  marginTop: 12,
                  marginBottom: 4,
                }}
              >
                Take Proof Photo
              </Text>
              <Text
                style={{ fontSize: 14, color: "#6b7280", textAlign: "center" }}
              >
                Take a photo of the collected bottles or pickup area
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Date Restriction Warning */}
        {!canCompletePickup() && (
          <View
            style={{
              backgroundColor: "#fef3c7",
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: "#fbbf24",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color="#92400e"
                style={{ marginRight: 8 }}
              />
              <Text
                style={{ fontSize: 16, fontWeight: "bold", color: "#92400e" }}
              >
                Pickup Not Ready
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: "#92400e", lineHeight: 20 }}>
              This pickup can only be completed on or after the scheduled date:{" "}
              {formatDateTime(pickup.scheduledDate)}
              {getTimeUntilPickup() && ` (Available ${getTimeUntilPickup()})`}
            </Text>
          </View>
        )}

        {/* Complete Button */}
        <TouchableOpacity
          onPress={handleCompletePickup}
          disabled={
            completing ||
            !proofPhoto ||
            !actualBottleCount ||
            !canCompletePickup()
          }
          style={{
            backgroundColor:
              completing ||
              !proofPhoto ||
              !actualBottleCount ||
              !canCompletePickup()
                ? "#9ca3af"
                : "#22c55e",
            borderRadius: 16,
            padding: 20,
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "white" }}>
            {completing
              ? "Completing..."
              : !canCompletePickup()
                ? "Complete on Pickup Date"
                : "Complete Pickup"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Photo Options Modal */}
      <Modal visible={showPhotoModal} animationType="slide" transparent>
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
                style={{ fontSize: 18, fontWeight: "bold", color: "#1f2937" }}
              >
                Add Proof Photo
              </Text>
              <TouchableOpacity onPress={() => setShowPhotoModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={takePhoto}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  backgroundColor: "#f3f4f6",
                  borderRadius: 12,
                }}
              >
                <Ionicons name="camera-outline" size={24} color="#374151" />
                <View style={{ marginLeft: 16, flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#1f2937",
                    }}
                  >
                    Take Photo
                  </Text>
                  <Text style={{ fontSize: 14, color: "#6b7280" }}>
                    Use camera to take a new photo
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={selectFromGallery}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  backgroundColor: "#f3f4f6",
                  borderRadius: 12,
                }}
              >
                <Ionicons name="images-outline" size={24} color="#374151" />
                <View style={{ marginLeft: 16, flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#1f2937",
                    }}
                  >
                    Choose from Gallery
                  </Text>
                  <Text style={{ fontSize: 14, color: "#6b7280" }}>
                    Select an existing photo
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
