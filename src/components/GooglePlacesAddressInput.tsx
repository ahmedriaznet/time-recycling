import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import * as Location from "expo-location";

interface GooglePlacesAddressInputProps {
  value: string;
  onAddressSelect: (address: string, fullDetails?: any) => void;
  placeholder?: string;
}

const GOOGLE_MAPS_API_KEY = "AIzaSyAf8Z-qSdOmxjdxxZ4mBHeEJUHwJLrlSz4";

export const GooglePlacesAddressInput: React.FC<
  GooglePlacesAddressInputProps
> = ({ value = "", onAddressSelect, placeholder = "Enter pickup address" }) => {
  const [loadingLocation, setLoadingLocation] = useState(false);
  const googlePlacesRef = useRef<any>(null);

  const getCurrentLocation = useCallback(async () => {
    try {
      setLoadingLocation(true);

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow location access to use current location feature.",
        );
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Reverse geocode to get address
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addressResponse.length > 0) {
        const address = addressResponse[0];
        const formattedAddress = [
          address.streetNumber,
          address.street,
          address.city,
          address.region,
          address.postalCode,
        ]
          .filter(Boolean)
          .join(", ");

        onAddressSelect(formattedAddress, {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        // Set the text in the GooglePlacesAutocomplete component
        if (googlePlacesRef.current) {
          googlePlacesRef.current.setAddressText(formattedAddress);
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
  }, [onAddressSelect]);

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
              ref={googlePlacesRef}
              placeholder={placeholder}
              onPress={(data, details = null) => {
                try {
                  if (data && data.description) {
                    onAddressSelect(data.description, details);
                  }
                } catch (error) {
                  console.error("Error handling address selection:", error);
                }
              }}
              onFail={(error) => {
                console.error("GooglePlacesAutocomplete error:", error);
              }}
              onNotFound={() => {
                console.log("No results found");
              }}
              query={{
                key: GOOGLE_MAPS_API_KEY,
                language: "en",
                types: "address",
                components: "country:us", // Restrict to US for better performance
              }}
              GooglePlacesDetailsQuery={{
                fields: "geometry,formatted_address,address_components",
              }}
              filterReverseGeocodingByTypes={[
                "locality",
                "administrative_area_level_3",
              ]}
              predefinedPlaces={[]}
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
                loader: {
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  height: 20,
                },
              }}
              fetchDetails={true}
              enablePoweredByContainer={false}
              debounce={300}
              minLength={2}
              keepResultsAfterBlur={false}
              enableHighAccuracyLocation={true}
              textInputProps={{
                defaultValue: value,
                onChangeText: (text) => {
                  if (!text) {
                    onAddressSelect("", null);
                  }
                },
                autoCorrect: false,
                autoCapitalize: "words",
                returnKeyType: "search",
                clearButtonMode: "while-editing",
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
