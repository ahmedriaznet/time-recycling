import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import * as Location from "expo-location";

interface WorkingGooglePlacesInputProps {
  value: string;
  onAddressChange: (address: string) => void;
  placeholder?: string;
}

const GOOGLE_MAPS_API_KEY = "AIzaSyAf8Z-qSdOmxjdxxZ4mBHeEJUHwJLrlSz4";

export const WorkingGooglePlacesInput: React.FC<
  WorkingGooglePlacesInputProps
> = ({ value, onAddressChange, placeholder = "Enter pickup address" }) => {
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

        // Build address from available data
        const addressParts = [];

        // Street address
        if (address.street) {
          if (address.streetNumber) {
            addressParts.push(`${address.streetNumber} ${address.street}`);
          } else {
            addressParts.push(address.street);
          }
        }

        // City
        if (address.city) {
          addressParts.push(address.city);
        }

        // State/Region
        if (address.region) {
          addressParts.push(address.region);
        }

        // Country
        if (address.country) {
          addressParts.push(address.country);
        }

        const formattedAddress = addressParts.filter(Boolean).join(", ");

        if (formattedAddress) {
          onAddressChange(formattedAddress);
          Alert.alert("Success!", "Current location detected successfully.");
        } else {
          Alert.alert("Error", "Could not get your current address");
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
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 4,
          }}
        >
          <Ionicons
            name="location-outline"
            size={20}
            color="#6b7280"
            style={{ marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <GooglePlacesAutocomplete
              placeholder={placeholder}
              onPress={(data) => {
                // Simple callback - just pass the description
                if (data && data.description) {
                  onAddressChange(data.description);
                }
              }}
              query={{
                key: GOOGLE_MAPS_API_KEY,
                language: "en",
              }}
              styles={{
                container: {
                  flex: 1,
                },
                textInputContainer: {
                  backgroundColor: "transparent",
                  borderTopWidth: 0,
                  borderBottomWidth: 0,
                  paddingHorizontal: 0,
                  marginVertical: 0,
                  height: 44,
                },
                textInput: {
                  backgroundColor: "transparent",
                  height: 44,
                  borderRadius: 0,
                  paddingVertical: 8,
                  paddingHorizontal: 0,
                  fontSize: 16,
                  color: "#1f2937",
                  borderWidth: 0,
                  marginLeft: 0,
                  marginRight: 0,
                },
                listView: {
                  backgroundColor: "white",
                  borderRadius: 8,
                  marginTop: 4,
                  elevation: 3,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  maxHeight: 200,
                },
                row: {
                  backgroundColor: "white",
                  padding: 13,
                  minHeight: 44,
                  flexDirection: "row",
                },
                separator: {
                  height: 0.5,
                  backgroundColor: "#e5e7eb",
                },
                description: {
                  fontSize: 14,
                  color: "#374151",
                },
              }}
              enablePoweredByContainer={false}
              fetchDetails={false}
              debounce={400}
              minLength={2}
              predefinedPlaces={[]}
              listViewDisplayed="auto"
              keepResultsAfterBlur={false}
              textInputProps={{
                autoCorrect: false,
                autoCapitalize: "words",
                returnKeyType: "search",
              }}
            />
          </View>
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
