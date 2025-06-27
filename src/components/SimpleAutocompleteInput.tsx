import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SimpleAutocompleteInputProps {
  value: string;
  onAddressChange: (address: string) => void;
  placeholder?: string;
}

const GOOGLE_MAPS_API_KEY = "AIzaSyAf8Z-qSdOmxjdxxZ4mBHeEJUHwJLrlSz4";

export const SimpleAutocompleteInput: React.FC<
  SimpleAutocompleteInputProps
> = ({ value, onAddressChange, placeholder = "Enter pickup address" }) => {
  const [inputText, setInputText] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchSuggestions = useCallback(async (text: string) => {
    if (text.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setLoadingSuggestions(true);
      console.log("🔍 Fetching suggestions for:", text);

      // Use a CORS proxy or direct API call
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        text,
      )}&key=${GOOGLE_MAPS_API_KEY}&language=en`;

      console.log("📡 API URL:", url);

      const response = await fetch(url);
      const data = await response.json();

      console.log("📋 API Response:", data);

      if (data.predictions && data.predictions.length > 0) {
        setSuggestions(data.predictions.slice(0, 5));
        setShowSuggestions(true);
        console.log("✅ Found", data.predictions.length, "suggestions");
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        console.log("❌ No suggestions found");
      }
    } catch (error) {
      console.error("❌ Error fetching suggestions:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  let debounceTimer: NodeJS.Timeout;

  const handleTextChange = (text: string) => {
    setInputText(text);
    onAddressChange(text);

    // Clear existing timer
    clearTimeout(debounceTimer);

    // Set new timer
    debounceTimer = setTimeout(() => {
      fetchSuggestions(text);
    }, 500);
  };

  const selectSuggestion = (suggestion: any) => {
    console.log("📍 Selected suggestion:", suggestion.description);
    const address = suggestion.description;
    setInputText(address);
    onAddressChange(address);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <View style={{ zIndex: 1000 }}>
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
          overflow: "visible",
          minHeight: showSuggestions ? 250 : 56,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: "#f9fafb",
            borderRadius: 12,
          }}
        >
          <Ionicons
            name="location-outline"
            size={20}
            color="#6b7280"
            style={{ marginRight: 12 }}
          />
          <TextInput
            style={{
              flex: 1,
              fontSize: 16,
              color: "#1f2937",
              minHeight: 32,
            }}
            placeholder={placeholder}
            value={inputText}
            onChangeText={handleTextChange}
            autoCorrect={false}
            autoCapitalize="words"
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
          />
          {loadingSuggestions && (
            <ActivityIndicator size="small" color="#6b7280" />
          )}
        </View>

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <View
            style={{
              backgroundColor: "white",
              borderTopWidth: 1,
              borderTopColor: "#e5e7eb",
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
              elevation: 3,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
          >
            {suggestions.map((item, index) => (
              <TouchableOpacity
                key={item.place_id}
                onPress={() => selectSuggestion(item)}
                style={{
                  padding: 16,
                  borderBottomWidth: index < suggestions.length - 1 ? 1 : 0,
                  borderBottomColor: "#f3f4f6",
                }}
              >
                <Text style={{ fontSize: 14, color: "#374151" }}>
                  {item.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};
