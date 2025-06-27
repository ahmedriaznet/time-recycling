import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useFirebasePickupStore } from "../../contexts/FirebasePickupStore";

export const CompletePickupScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const pickup = (route.params as any)?.pickup;
  const { updatePickup } = useFirebasePickupStore();

  const [actualBottleCount, setActualBottleCount] = useState(
    pickup?.bottleCount?.toString() || "",
  );
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  if (!pickup) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ fontSize: 18, color: "#6b7280" }}>
            No pickup data found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera roll permissions are required to upload photos.",
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotos([...photos, result.assets[0].uri]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const pickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotos([...photos, result.assets[0].uri]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select image");
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleComplete = async () => {
    if (!actualBottleCount || parseInt(actualBottleCount) < 0) {
      Alert.alert("Error", "Please enter a valid bottle count");
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Update pickup status to completed
      await updatePickup(pickup.id, {
        status: "completed",
        bottleCount: parseInt(actualBottleCount),
        notes: notes || `Pickup completed. ${photos.length} photos taken.`,
        completedAt: new Date().toISOString(),
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      Alert.alert(
        "Pickup Completed!",
        `Successfully completed pickup of ${actualBottleCount} bottles.`,
        [
          {
            text: "OK",
            onPress: () => {
              navigation.goBack();
              navigation.goBack(); // Go back to dashboard
            },
          },
        ],
      );
    } catch (error) {
      console.error("Error completing pickup:", error);
      Alert.alert("Error", "Failed to complete pickup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Pickup",
      "Are you sure you want to cancel this pickup? This action cannot be undone.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await updatePickup(pickup.id, {
                status: "cancelled",
                notes: notes || "Pickup cancelled by driver",
                completedAt: new Date().toISOString(),
              });

              Alert.alert(
                "Pickup Cancelled",
                "The pickup has been cancelled.",
                [{ text: "OK", onPress: () => navigation.goBack() }],
              );
            } catch (error) {
              Alert.alert("Error", "Failed to cancel pickup");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <LinearGradient
        colors={["#4facfe", "#00f2fe"]}
        style={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 30,
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
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>
              Complete Pickup
            </Text>
            <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
              Finalize the pickup details
            </Text>
          </View>
        </View>

        {/* Pickup Info */}
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: "white",
              marginBottom: 8,
            }}
          >
            Pickup Details
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.9)",
              marginBottom: 4,
            }}
          >
            Scheduled: {formatDate(pickup.scheduledDate)}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.9)",
              marginBottom: 4,
            }}
          >
            Expected: {pickup.bottleCount} bottles
          </Text>
          {pickup.address && (
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.9)" }}>
              Address: {pickup.address}
            </Text>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 20 }}>
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
              Actual Bottle Count
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
          </View>

          {/* Photos */}
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
              Photos ({photos.length})
            </Text>

            {/* Photo Grid */}
            {photos.length > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  marginBottom: 16,
                  gap: 8,
                }}
              >
                {photos.map((photo, index) => (
                  <View key={index} style={{ position: "relative" }}>
                    <Image
                      source={{ uri: photo }}
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 8,
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => removePhoto(index)}
                      style={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        backgroundColor: "#ef4444",
                        borderRadius: 12,
                        width: 24,
                        height: 24,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="close" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Photo Actions */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={takePhoto}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#3b82f6",
                  borderRadius: 12,
                  paddingVertical: 12,
                }}
              >
                <Ionicons
                  name="camera"
                  size={20}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "white" }}
                >
                  Take Photo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={pickImage}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#6b7280",
                  borderRadius: 12,
                  paddingVertical: 12,
                }}
              >
                <Ionicons
                  name="images"
                  size={20}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "white" }}
                >
                  From Gallery
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Notes */}
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
              Notes (Optional)
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                color: "#1f2937",
                backgroundColor: "#f9fafb",
                minHeight: 100,
                textAlignVertical: "top",
              }}
              placeholder="Add any notes about the pickup..."
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View
        style={{
          padding: 20,
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
        }}
      >
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            onPress={handleCancel}
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: "#ef4444",
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
              opacity: loading ? 0.5 : 1,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "white" }}>
              Cancel Pickup
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleComplete}
            disabled={loading}
            style={{
              flex: 2,
              backgroundColor: "#22c55e",
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
              opacity: loading ? 0.5 : 1,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "white" }}>
              {loading ? "Completing..." : "Complete Pickup"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};
