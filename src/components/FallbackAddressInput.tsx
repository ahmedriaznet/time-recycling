import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

interface FallbackAddressInputProps {
  value: string;
  onAddressChange: (address: string) => void;
  placeholder?: string;
}

export const FallbackAddressInput: React.FC<FallbackAddressInputProps> = ({
  value,
  onAddressChange,
  placeholder = "Enter pickup address",
}) => {
  const [loadingLocation, setLoadingLocation] = useState(false);

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow location access to use current location feature.",
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const addressResponse = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addressResponse.length > 0) {
        const address = addressResponse[0];

        // Log all available properties for debugging
        console.log(
          "🔍 All address properties:",
          JSON.stringify(address, null, 2),
        );

        // Build address components in logical order
        const addressParts = [];

        // Street address - work with available data
        let streetAddress = "";

        // For international addresses, street might not have a number
        if (address.street) {
          // If we have both street number and street name
          if (address.streetNumber) {
            streetAddress = `${address.streetNumber} ${address.street}`;
          } else {
            // Just use the street name (common in many countries)
            streetAddress = address.street;
          }
        } else if (
          address.name &&
          address.name !== address.city &&
          address.name !== address.region
        ) {
          // Use name if it's different from city/region
          streetAddress = address.name;
        } else if (address.thoroughfare) {
          // iOS specific property
          if (address.subThoroughfare) {
            streetAddress = `${address.subThoroughfare} ${address.thoroughfare}`;
          } else {
            streetAddress = address.thoroughfare;
          }
        } else if (address.formattedAddress) {
          // Sometimes the full formatted address is available
          const parts = address.formattedAddress.split(",");
          if (parts.length > 0) {
            streetAddress = parts[0].trim();
          }
        }

        if (streetAddress) {
          addressParts.push(streetAddress);
        }

        // City - try multiple properties
        let cityName = "";
        if (address.city) {
          cityName = address.city;
        } else if (address.subregion) {
          cityName = address.subregion;
        } else if (address.locality) {
          cityName = address.locality;
        } else if (address.subAdministrativeArea) {
          cityName = address.subAdministrativeArea;
        }

        if (cityName) {
          addressParts.push(cityName);
        }

        // State/Region - try multiple properties
        let stateName = "";
        if (address.region) {
          stateName = address.region;
        } else if (address.administrativeArea) {
          stateName = address.administrativeArea;
        }

        if (stateName) {
          addressParts.push(stateName);
        }

        // Postal code
        if (address.postalCode) {
          addressParts.push(address.postalCode);
        }

        // Country (always include for international addresses)
        if (address.country) {
          addressParts.push(address.country);
        }

        const formattedAddress = addressParts.filter(Boolean).join(", ");

        if (formattedAddress) {
          onAddressChange(formattedAddress);
          console.log("✅ Full address detected:", formattedAddress);

          // Show appropriate success message
          if (streetAddress && cityName) {
            Alert.alert(
              "Success!",
              `Location detected: ${streetAddress}, ${cityName}`,
            );
          } else if (cityName) {
            Alert.alert(
              "Location Detected",
              `Found: ${cityName}. You can add more specific street details if needed.`,
            );
          } else {
            Alert.alert(
              "Partial Success",
              "Location detected. Please add more address details if needed.",
            );
          }
        } else {
          // Fallback to coordinate-based address
          const coords = `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;
          onAddressChange(`Location: ${coords}`);
          Alert.alert(
            "Partial Success",
            "Got your location coordinates. Please add street address details manually.",
          );
        }
      } else {
        Alert.alert("Error", "Could not get your current address");
      }
    } catch (error) {
      console.error("Error getting current location:", error);
      Alert.alert("Error", "Failed to get your current location");
    } finally {
      setLoadingLocation(false);
    }
  };

  return (
    <View>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: "#374151",
          marginBottom: 8,
        }}
      >
        Pickup Address *
      </Text>

      <View
        style={{
          borderWidth: 1,
          borderColor: "#d1d5db",
          borderRadius: 12,
          backgroundColor: "#f9fafb",
          overflow: "hidden",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <Ionicons
            name="location-outline"
            size={20}
            color="#6b7280"
            style={{ marginRight: 12, marginTop: 2 }}
          />
          <TextInput
            style={{
              flex: 1,
              fontSize: 16,
              color: "#1f2937",
              textAlignVertical: "top",
            }}
            placeholder={placeholder}
            value={value}
            onChangeText={onAddressChange}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Current Location Button */}
        <TouchableOpacity
          onPress={getCurrentLocation}
          disabled={loadingLocation}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: "#eff6ff",
            borderTopWidth: 1,
            borderTopColor: "#e5e7eb",
          }}
        >
          {loadingLocation ? (
            <ActivityIndicator
              size="small"
              color="#3b82f6"
              style={{ marginRight: 8 }}
            />
          ) : (
            <Ionicons
              name="locate"
              size={18}
              color="#3b82f6"
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            style={{
              fontSize: 14,
              color: "#3b82f6",
              fontWeight: "500",
            }}
          >
            {loadingLocation
              ? "Getting your location..."
              : "Use Current Location"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
