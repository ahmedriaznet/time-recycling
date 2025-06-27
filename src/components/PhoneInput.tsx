import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PhoneInputProps
  extends Omit<TextInputProps, "value" | "onChangeText"> {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: any;
  containerStyle?: any;
  showLabel?: boolean;
  textColor?: string;
  placeholderTextColor?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label = "Phone Number",
  value,
  onChangeText,
  placeholder = "Enter phone number",
  style,
  containerStyle,
  showLabel = true,
  textColor = "#1f2937",
  placeholderTextColor = "#9ca3af",
  ...textInputProps
}) => {
  const [formattedValue, setFormattedValue] = useState(value);

  useEffect(() => {
    // If value doesn't start with +1, add it
    if (value && !value.startsWith("+1")) {
      // Remove any existing country codes or formatting
      const cleanNumber = value
        .replace(/^\+?\d{1,3}\s?/, "")
        .replace(/\D/g, "");
      if (cleanNumber) {
        const newValue = `+1 ${cleanNumber}`;
        setFormattedValue(newValue);
        onChangeText(newValue);
      }
    } else if (!value) {
      setFormattedValue("+1 ");
    } else {
      setFormattedValue(value);
    }
  }, []);

  const handleTextChange = (text: string) => {
    // Always ensure +1 prefix
    if (!text.startsWith("+1")) {
      if (text.length === 0) {
        const newValue = "+1 ";
        setFormattedValue(newValue);
        onChangeText(newValue);
        return;
      } else {
        // Remove any existing country codes and add +1
        const cleanNumber = text
          .replace(/^\+?\d{1,3}\s?/, "")
          .replace(/\D/g, "");
        const newValue = `+1 ${cleanNumber}`;
        setFormattedValue(newValue);
        onChangeText(newValue);
        return;
      }
    }

    // Format the number nicely
    let cleaned = text.replace(/\D/g, "");
    if (cleaned.startsWith("1")) {
      cleaned = cleaned.substring(1); // Remove the 1 from +1
    }

    // Add formatting: +1 (XXX) XXX-XXXX
    let formatted = "+1 ";
    if (cleaned.length > 0) {
      if (cleaned.length <= 3) {
        formatted += cleaned;
      } else if (cleaned.length <= 6) {
        formatted += `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
      } else {
        formatted += `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
      }
    }

    setFormattedValue(formatted);
    onChangeText(formatted);
  };

  return (
    <View style={containerStyle}>
      {showLabel && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: "#374151",
            marginBottom: 8,
          }}
        >
          {label}
        </Text>
      )}
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
          ...style,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          {/* American Flag */}
          <Text style={{ fontSize: 18, marginRight: 8 }}>🇺🇸</Text>
          <Ionicons name="call-outline" size={20} color="#6b7280" />
        </View>
        <TextInput
          style={{
            flex: 1,
            fontSize: 16,
            color: textColor,
          }}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          value={formattedValue}
          onChangeText={handleTextChange}
          keyboardType="phone-pad"
          autoComplete="tel"
          {...textInputProps}
        />
      </View>
    </View>
  );
};
