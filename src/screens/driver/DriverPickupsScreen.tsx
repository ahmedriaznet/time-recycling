import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useFirebasePickupStore } from "../../contexts/FirebasePickupStore";
import { useUnifiedAuth } from "../../hooks/useUnifiedAuth";

// Firebase imports removed to prevent any Firebase queries

export const DriverPickupsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useUnifiedAuth();
  const { getPickupsForDriver, loading, error } = useFirebasePickupStore();

  // Get pickups for current driver
  const pickups = getPickupsForDriver(user?.uid || "");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <LinearGradient
        colors={["#4facfe", "#00f2fe"]}
        style={{
          paddingHorizontal: 20,
          paddingVertical: 30,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>
          All Pickups
        </Text>
      </LinearGradient>

      <ScrollView style={{ flex: 1, padding: 20 }}>
        {pickups.map((pickup) => (
          <TouchableOpacity
            key={pickup.id}
            onPress={() =>
              navigation.navigate("PickupDetails" as never, { pickup } as never)
            }
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text
              style={{ fontSize: 16, fontWeight: "bold", color: "#1f2937" }}
            >
              {pickup.vendorName || "Vendor"} - {pickup.bottleCount} bottles
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};
