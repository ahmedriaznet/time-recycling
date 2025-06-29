import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useFirebasePickupStore } from "../../contexts/FirebasePickupStore";
import { useUnifiedAuth } from "../../hooks/useUnifiedAuth";

interface RouteStop {
  id: string;
  address: string;
  vendorName: string;
  bottleCount: number;
  scheduledTime: string;
  priority: "high" | "medium" | "low";
  estimatedDuration: number; // minutes
}

export const RoutePlannerScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useUnifiedAuth();
  const { getPickupsForDriver } = useFirebasePickupStore();
  const [optimizedRoute, setOptimizedRoute] = useState<RouteStop[]>([]);
  const [totalDistance, setTotalDistance] = useState("12.5 km");
  const [totalTime, setTotalTime] = useState("45 min");

  useEffect(() => {
    generateOptimizedRoute();
  }, []);

  const generateOptimizedRoute = () => {
    // Get today's pickups for the driver
    const driverPickups = getPickupsForDriver(user?.uid || "");
    const todaysPickups = driverPickups.filter((pickup) => {
      const today = new Date().toISOString().split("T")[0];
      const pickupDate = new Date(pickup.scheduledDate)
        .toISOString()
        .split("T")[0];
      return (
        (pickup.status === "assigned" || pickup.status === "in-progress") &&
        pickupDate === today
      );
    });

    // Convert to route stops and optimize (simple algorithm)
    const stops: RouteStop[] = todaysPickups.map((pickup, index) => ({
      id: pickup.id,
      address:
        pickup.address || pickup.vendorAddress || "Address not available",
      vendorName: pickup.vendorName || "Unknown Vendor",
      bottleCount: pickup.bottleCount,
      scheduledTime: new Date(pickup.scheduledDate).toLocaleTimeString(
        "en-US",
        {
          hour: "numeric",
          minute: "2-digit",
        },
      ),
      priority:
        pickup.bottleCount > 100
          ? "high"
          : pickup.bottleCount > 50
            ? "medium"
            : "low",
      estimatedDuration: Math.max(15, pickup.bottleCount / 10), // 1 min per 10 bottles, min 15 min
    }));

    // Simple optimization: sort by scheduled time then by priority
    const optimized = stops.sort((a, b) => {
      const timeA = new Date(`1970/01/01 ${a.scheduledTime}`).getTime();
      const timeB = new Date(`1970/01/01 ${b.scheduledTime}`).getTime();
      if (timeA !== timeB) return timeA - timeB;

      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    setOptimizedRoute(optimized);
  };

  const handleStartRoute = () => {
    if (optimizedRoute.length === 0) {
      Alert.alert("No Route", "No pickups scheduled for today");
      return;
    }

    // Create waypoints for Google Maps
    const waypoints = optimizedRoute
      .map((stop) => encodeURIComponent(stop.address))
      .join("/");
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${waypoints}`;

    Alert.alert(
      "Start Route",
      "This will open your navigation app with the optimized route. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start Navigation",
          onPress: () => {
            Linking.openURL(googleMapsUrl).catch(() => {
              Alert.alert("Error", "Could not open navigation app");
            });
          },
        },
      ],
    );
  };

  const handleNavigateToStop = (stop: RouteStop) => {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stop.address)}`;

    Linking.openURL(googleMapsUrl).catch(() => {
      Alert.alert("Error", "Could not open navigation app");
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      default:
        return "#22c55e";
    }
  };

  const RouteStopCard: React.FC<{ stop: RouteStop; index: number }> = ({
    stop,
    index,
  }) => (
    <View style={styles.stopCard}>
      <View style={styles.stopHeader}>
        <View
          style={[
            styles.stopNumber,
            { backgroundColor: getPriorityColor(stop.priority) },
          ]}
        >
          <Text style={styles.stopNumberText}>{index + 1}</Text>
        </View>
        <View style={styles.stopInfo}>
          <Text style={styles.vendorName}>{stop.vendorName}</Text>
          <Text style={styles.stopTime}>{stop.scheduledTime}</Text>
        </View>
        <View style={styles.stopStats}>
          <Text style={styles.bottleCount}>{stop.bottleCount}</Text>
          <Text style={styles.bottleLabel}>bottles</Text>
        </View>
      </View>

      <Text style={styles.address}>{stop.address}</Text>

      <View style={styles.stopActions}>
        <TouchableOpacity
          onPress={() => handleNavigateToStop(stop)}
          style={styles.navigateButton}
        >
          <Ionicons name="navigate" size={16} color="#3b82f6" />
          <Text style={styles.navigateText}>Navigate</Text>
        </TouchableOpacity>
        <Text style={styles.duration}>~{stop.estimatedDuration} min</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Route Planner</Text>
          <TouchableOpacity
            onPress={generateOptimizedRoute}
            style={styles.refreshButton}
          >
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {optimizedRoute.length > 0 && (
          <View style={styles.routeSummary}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{optimizedRoute.length}</Text>
              <Text style={styles.summaryLabel}>Stops</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{totalDistance}</Text>
              <Text style={styles.summaryLabel}>Distance</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{totalTime}</Text>
              <Text style={styles.summaryLabel}>Time</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      <ScrollView style={styles.content}>
        {optimizedRoute.length > 0 ? (
          <>
            <View style={styles.optimizationInfo}>
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              <Text style={styles.optimizationText}>
                Route optimized by time and priority
              </Text>
            </View>

            {optimizedRoute.map((stop, index) => (
              <RouteStopCard key={stop.id} stop={stop} index={index} />
            ))}

            <TouchableOpacity
              onPress={handleStartRoute}
              style={styles.startButton}
            >
              <Ionicons
                name="play"
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.startButtonText}>Start Route Navigation</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No Pickups Today</Text>
            <Text style={styles.emptyText}>
              You don't have any pickups scheduled for today. Check back later
              or browse available pickups.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("PickupsTab" as never)}
              style={styles.browseButton}
            >
              <Text style={styles.browseButtonText}>
                Browse Available Pickups
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  refreshButton: {
    padding: 8,
  },
  routeSummary: {
    flexDirection: "row",
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  summaryLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  optimizationInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  optimizationText: {
    fontSize: 14,
    color: "#15803d",
    marginLeft: 8,
  },
  stopCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stopHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  stopNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stopNumberText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
  },
  stopInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  stopTime: {
    fontSize: 14,
    color: "#6b7280",
  },
  stopStats: {
    alignItems: "center",
  },
  bottleCount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3b82f6",
  },
  bottleLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  address: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 12,
  },
  stopActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navigateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  navigateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3b82f6",
    marginLeft: 4,
  },
  duration: {
    fontSize: 14,
    color: "#6b7280",
  },
  startButton: {
    backgroundColor: "#22c55e",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  browseButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});
