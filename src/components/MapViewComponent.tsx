import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Linking,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Pickup {
  id: string;
  vendorName: string;
  address?: string;
  vendorAddress?: string;
  bottleCount: number;
  status: string;
  scheduledDate: string;
}

interface MapViewComponentProps {
  pickups: Pickup[];
  onSwitchToList: () => void;
}

export const MapViewComponent: React.FC<MapViewComponentProps> = ({
  pickups,
  onSwitchToList,
}) => {
  const [selectedPickup, setSelectedPickup] = useState<Pickup | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "#3b82f6";
      case "in-progress":
        return "#8b5cf6";
      case "completed":
        return "#22c55e";
      default:
        return "#6b7280";
    }
  };

  const handleNavigateToPickup = (pickup: Pickup) => {
    const address = pickup.address || pickup.vendorAddress || "";
    if (!address) {
      Alert.alert("Error", "No address available for this pickup");
      return;
    }

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

    Linking.openURL(googleMapsUrl).catch(() => {
      Alert.alert("Error", "Could not open navigation app");
    });
  };

  const handleShowAllOnMap = () => {
    if (pickups.length === 0) {
      Alert.alert("No Pickups", "No pickups to show on map");
      return;
    }

    // Create waypoints for all pickup addresses
    const addresses = pickups
      .map((p) => p.address || p.vendorAddress)
      .filter((addr) => addr)
      .map((addr) => encodeURIComponent(addr!));

    if (addresses.length === 0) {
      Alert.alert("Error", "No valid addresses found for these pickups");
      return;
    }

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&waypoints=${addresses.slice(0, -1).join("|")}&destination=${addresses[addresses.length - 1]}`;

    Linking.openURL(googleMapsUrl).catch(() => {
      Alert.alert("Error", "Could not open navigation app");
    });
  };

  const PickupMarker: React.FC<{ pickup: Pickup; isSelected: boolean }> = ({
    pickup,
    isSelected,
  }) => (
    <TouchableOpacity
      onPress={() => setSelectedPickup(isSelected ? null : pickup)}
      style={[
        styles.marker,
        {
          backgroundColor: getStatusColor(pickup.status),
          transform: [{ scale: isSelected ? 1.2 : 1 }],
          zIndex: isSelected ? 10 : 1,
        },
      ]}
    >
      <Ionicons name="location" size={16} color="white" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Map Placeholder with Interactive Elements */}
      <View style={styles.mapContainer}>
        {/* Simulated Map Background */}
        <View style={styles.mapBackground}>
          <View style={styles.gridOverlay} />

          {/* Street Labels */}
          <Text style={[styles.streetLabel, { top: 50, left: 20 }]}>
            Main St
          </Text>
          <Text style={[styles.streetLabel, { top: 120, right: 30 }]}>
            Oak Ave
          </Text>
          <Text style={[styles.streetLabel, { bottom: 80, left: 40 }]}>
            Elm Rd
          </Text>

          {/* Pickup Markers */}
          {pickups.slice(0, 6).map((pickup, index) => (
            <View
              key={pickup.id}
              style={[
                styles.markerContainer,
                {
                  top: 60 + (index % 3) * 80,
                  left: 30 + Math.floor(index / 3) * 120,
                },
              ]}
            >
              <PickupMarker
                pickup={pickup}
                isSelected={selectedPickup?.id === pickup.id}
              />
            </View>
          ))}

          {/* Driver Location */}
          <View style={[styles.markerContainer, { bottom: 60, right: 50 }]}>
            <View style={styles.driverMarker}>
              <Ionicons name="car" size={20} color="white" />
            </View>
          </View>
        </View>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            onPress={onSwitchToList}
            style={styles.controlButton}
          >
            <Ionicons name="list" size={20} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShowAllOnMap}
            style={styles.controlButton}
          >
            <Ionicons name="navigate" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Selected Pickup Info */}
      {selectedPickup && (
        <View style={styles.pickupInfo}>
          <View style={styles.pickupHeader}>
            <Text style={styles.pickupVendor}>{selectedPickup.vendorName}</Text>
            <TouchableOpacity onPress={() => setSelectedPickup(null)}>
              <Ionicons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <Text style={styles.pickupAddress}>
            {selectedPickup.address ||
              selectedPickup.vendorAddress ||
              "Address not available"}
          </Text>
          <View style={styles.pickupDetails}>
            <Text style={styles.pickupBottles}>
              {selectedPickup.bottleCount} bottles
            </Text>
            <Text style={styles.pickupTime}>
              {new Date(selectedPickup.scheduledDate).toLocaleTimeString(
                "en-US",
                {
                  hour: "numeric",
                  minute: "2-digit",
                },
              )}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleNavigateToPickup(selectedPickup)}
            style={styles.navigateButton}
          >
            <Ionicons name="navigate" size={16} color="white" />
            <Text style={styles.navigateButtonText}>Navigate</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pickup List */}
      <ScrollView
        style={styles.pickupList}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {pickups.map((pickup) => (
          <TouchableOpacity
            key={pickup.id}
            onPress={() => setSelectedPickup(pickup)}
            style={[
              styles.pickupCard,
              selectedPickup?.id === pickup.id && styles.selectedCard,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(pickup.status) },
              ]}
            />
            <Text style={styles.cardVendor}>{pickup.vendorName}</Text>
            <Text style={styles.cardBottles}>{pickup.bottleCount} bottles</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {pickups.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="map-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No Pickups to Show</Text>
          <Text style={styles.emptyText}>
            When you have scheduled pickups, they'll appear on the map here.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    margin: 16,
    overflow: "hidden",
  },
  mapBackground: {
    flex: 1,
    backgroundColor: "#e5f3ff",
    position: "relative",
  },
  gridOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    borderColor: "rgba(59, 130, 246, 0.1)",
    borderWidth: 1,
  },
  streetLabel: {
    position: "absolute",
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  markerContainer: {
    position: "absolute",
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  driverMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  mapControls: {
    position: "absolute",
    top: 16,
    right: 16,
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    backgroundColor: "white",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pickupInfo: {
    backgroundColor: "white",
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pickupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pickupVendor: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  pickupAddress: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 12,
  },
  pickupDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  pickupBottles: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3b82f6",
  },
  pickupTime: {
    fontSize: 14,
    color: "#6b7280",
  },
  navigateButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  navigateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },
  pickupList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickupCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    minWidth: 120,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedCard: {
    backgroundColor: "#eff6ff",
    borderWidth: 2,
    borderColor: "#3b82f6",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  cardVendor: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 4,
  },
  cardBottles: {
    fontSize: 10,
    color: "#6b7280",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
});
