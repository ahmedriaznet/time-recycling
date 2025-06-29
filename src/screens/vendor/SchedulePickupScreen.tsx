import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { useUnifiedAuth } from "../../hooks/useUnifiedAuth";
import { useFirebasePickupStore } from "../../contexts/FirebasePickupStore";
import { SimpleAutocompleteInput } from "../../components/SimpleAutocompleteInput";
import { PhoneInput } from "../../components/PhoneInput";

export const SchedulePickupScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const { user } = useUnifiedAuth();
  const { addPickup, error } = useFirebasePickupStore();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const initialFormData = {
    bottleCount: "",
    pickupDate: "",
    pickupTime: "",
    notes: "",
    address: "",
    contactPhone: "+1 ",
  };

  const [formData, setFormData] = useState(initialFormData);

  // Clear form when component mounts (fresh start each time)
  React.useEffect(() => {
    setFormData(initialFormData);
  }, []);

  // Function to reset form
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setShowDatePicker(false);
    setShowTimePicker(false);
  }, []);

  const updateFormData = useCallback(
    (field: string, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // const handleAddressSelect = useCallback((address: string, details?: any) => {
  //   updateFormData("address", address);
  //   // Optionally store coordinates for future use
  //   if (details?.geometry?.location) {
  //     console.log("Selected location coordinates:", details.geometry.location);
  //   }
  // }, [updateFormData]);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute of [0, 30]) {
        const time = new Date();
        time.setHours(hour, minute, 0, 0);
        slots.push(
          time.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
        );
      }
    }
    return slots;
  }, []);

  const dateOptions = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      // Fix timezone issue by using local date formatting
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const localDateString = `${year}-${month}-${day}`;

      dates.push({
        value: localDateString,
        label: date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
      });
    }
    return dates;
  }, []);

  const handleSubmit = async () => {
    if (
      !formData.bottleCount ||
      !formData.pickupDate ||
      !formData.pickupTime ||
      !formData.address
    ) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (parseInt(formData.bottleCount) < 1) {
      Alert.alert("Error", "Bottle count must be at least 1");
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Safer date parsing with validation
      let scheduledDateTime;
      try {
        const timeIn24h = convertTo24Hour(formData.pickupTime);
        const dateTimeString = `${formData.pickupDate}T${timeIn24h}`;
        scheduledDateTime = new Date(dateTimeString);

        // Validate the date is not invalid
        if (isNaN(scheduledDateTime.getTime())) {
          throw new Error("Invalid date/time combination");
        }
      } catch (dateError) {
        console.error("Date parsing error:", dateError);
        // Fallback to a valid date (tomorrow at 10 AM)
        scheduledDateTime = new Date();
        scheduledDateTime.setDate(scheduledDateTime.getDate() + 1);
        scheduledDateTime.setHours(10, 0, 0, 0);
      }

      // Create pickup data
      const pickupData = {
        vendorId: user?.uid || "",
        vendorName: user?.name || "",
        vendorBusinessName: user?.businessName || "",
        bottleCount: parseInt(formData.bottleCount),
        scheduledDate: scheduledDateTime.toISOString(),
        notes: formData.notes,
        address: formData.address,
        contactPhone: formData.contactPhone,
        status: "pending" as const,
      };

      // Save to Firebase
      await addPickup(pickupData);

      console.log("🔥 Pickup scheduled and saved to Firebase:", pickupData);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Reset form for next pickup
      resetForm();

      Alert.alert(
        "Success!",
        "Your pickup has been scheduled successfully!\n\nYour pickup has been saved to the cloud and drivers will be notified.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      console.error("Error creating pickup:", error);
      Alert.alert("Error", "Failed to schedule pickup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const convertTo24Hour = (time12h: string) => {
    try {
      if (!time12h || typeof time12h !== "string") {
        return "10:00:00"; // Default fallback
      }

      const parts = time12h.trim().split(" ");
      if (parts.length !== 2) {
        return "10:00:00"; // Default fallback
      }

      const [time, modifier] = parts;
      const timeParts = time.split(":");
      if (timeParts.length !== 2) {
        return "10:00:00"; // Default fallback
      }

      let [hours, minutes] = timeParts;
      const hoursNum = parseInt(hours, 10);
      const minutesNum = parseInt(minutes, 10);

      // Validate hours and minutes
      if (
        isNaN(hoursNum) ||
        isNaN(minutesNum) ||
        hoursNum < 1 ||
        hoursNum > 12 ||
        minutesNum < 0 ||
        minutesNum >= 60
      ) {
        return "10:00:00"; // Default fallback
      }

      if (hours === "12") hours = "00";
      if (modifier.toUpperCase() === "PM" && hours !== "00") {
        hours = (parseInt(hours, 10) + 12).toString();
      }

      return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;
    } catch (error) {
      console.error("Error converting time:", error);
      return "10:00:00"; // Default fallback
    }
  };

  const DatePickerModal = useMemo(
    () => (
      <Modal visible={showDatePicker} transparent animationType="slide">
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
              padding: 20,
              maxHeight: "50%",
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
                Select Date
              </Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {dateOptions.map((date) => (
                <TouchableOpacity
                  key={date.value}
                  onPress={() => {
                    updateFormData("pickupDate", date.value);
                    setShowDatePicker(false);
                  }}
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: "#f3f4f6",
                  }}
                >
                  <Text style={{ fontSize: 16, color: "#1f2937" }}>
                    {date.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    ),
    [showDatePicker, dateOptions, updateFormData],
  );

  const TimePickerModal = useMemo(
    () => (
      <Modal visible={showTimePicker} transparent animationType="slide">
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
              padding: 20,
              maxHeight: "50%",
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
                Select Time
              </Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {timeSlots.map((time) => (
                <TouchableOpacity
                  key={time}
                  onPress={() => {
                    updateFormData("pickupTime", time);
                    setShowTimePicker(false);
                  }}
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: "#f3f4f6",
                  }}
                >
                  <Text style={{ fontSize: 16, color: "#1f2937" }}>{time}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    ),
    [showTimePicker, timeSlots, updateFormData],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Header */}
          <LinearGradient
            colors={["#667eea", "#764ba2"]}
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
                  width: 40,
                  height: 40,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <Ionicons name="calendar-outline" size={20} color="white" />
              </View>
              <View>
                <Text
                  style={{ fontSize: 24, fontWeight: "bold", color: "white" }}
                >
                  Schedule Pickup
                </Text>
                <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
                  Request a bottle collection
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Form */}
          <View style={{ padding: 20 }}>
            {/* Pickup Details Card */}
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
                Pickup Details
              </Text>

              {/* Bottle Count */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  Number of Bottles *
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
                    placeholder="Enter approximate bottle count"
                    value={formData.bottleCount}
                    onChangeText={(text) => updateFormData("bottleCount", text)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Date */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  Preferred Date *
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
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
                    name="calendar-outline"
                    size={20}
                    color="#6b7280"
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 16,
                      color: formData.pickupDate ? "#1f2937" : "#9ca3af",
                    }}
                  >
                    {formData.pickupDate
                      ? new Date(formData.pickupDate).toLocaleDateString(
                          "en-US",
                          { weekday: "long", month: "long", day: "numeric" },
                        )
                      : "Select pickup date"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* Time */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  Preferred Time *
                </Text>
                <TouchableOpacity
                  onPress={() => setShowTimePicker(true)}
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
                    name="time-outline"
                    size={20}
                    color="#6b7280"
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 16,
                      color: formData.pickupTime ? "#1f2937" : "#9ca3af",
                    }}
                  >
                    {formData.pickupTime || "Select pickup time"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* Address */}
              <View style={{ marginBottom: 16 }}>
                <SimpleAutocompleteInput
                  value={formData.address}
                  onAddressChange={(address) =>
                    updateFormData("address", address)
                  }
                  placeholder="Enter pickup address"
                />
              </View>

              {/* Contact Phone */}
              <View style={{ marginBottom: 16 }}>
                <PhoneInput
                  label="Contact Phone"
                  value={formData.contactPhone}
                  onChangeText={(text) => updateFormData("contactPhone", text)}
                  placeholder="Contact phone number"
                />
              </View>

              {/* Notes */}
              <View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  Additional Notes
                </Text>
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: "#f9fafb",
                    minHeight: 80,
                  }}
                >
                  <TextInput
                    style={{
                      fontSize: 16,
                      color: "#1f2937",
                      textAlignVertical: "top",
                    }}
                    placeholder="Any special instructions or notes"
                    value={formData.notes}
                    onChangeText={(text) => updateFormData("notes", text)}
                    multiline
                  />
                </View>
              </View>
            </View>

            {/* Summary */}
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
                Pickup Summary
              </Text>

              <View style={{ gap: 8 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ color: "#6b7280" }}>Bottles:</Text>
                  <Text style={{ color: "#1f2937", fontWeight: "600" }}>
                    {formData.bottleCount || "-"}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ color: "#6b7280" }}>Date:</Text>
                  <Text style={{ color: "#1f2937", fontWeight: "600" }}>
                    {formData.pickupDate
                      ? new Date(formData.pickupDate).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" },
                        )
                      : "-"}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ color: "#6b7280" }}>Time:</Text>
                  <Text style={{ color: "#1f2937", fontWeight: "600" }}>
                    {formData.pickupTime || "-"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={{
                backgroundColor: loading ? "#9ca3af" : "#3b82f6",
                borderRadius: 16,
                padding: 20,
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "bold", color: "white" }}
              >
                {loading ? "Scheduling..." : "Schedule Pickup"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {DatePickerModal}
        {TimePickerModal}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
