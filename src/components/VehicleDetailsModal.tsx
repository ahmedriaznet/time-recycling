import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface VehicleDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentVehicleInfo?: string;
  userId: string;
}

export const VehicleDetailsModal: React.FC<VehicleDetailsModalProps> = ({
  visible,
  onClose,
  onSuccess,
  currentVehicleInfo = "",
  userId,
}) => {
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (visible && currentVehicleInfo) {
      // Parse existing vehicle info if available
      try {
        const parsed = JSON.parse(currentVehicleInfo);
        setVehicleType(parsed.type || "");
        setVehicleMake(parsed.make || "");
        setVehicleModel(parsed.model || "");
        setVehicleYear(parsed.year || "");
        setLicensePlate(parsed.licensePlate || "");
        setVehicleColor(parsed.color || "");
      } catch {
        // If not JSON, treat as plain text
        setVehicleType(currentVehicleInfo);
      }
    }
  }, [visible, currentVehicleInfo]);

  const handleSave = async () => {
    if (!vehicleType.trim()) {
      Alert.alert("Error", "Please enter vehicle type");
      return;
    }

    setLoading(true);
    try {
      // Create vehicle info object
      const vehicleInfo = {
        type: vehicleType.trim(),
        make: vehicleMake.trim(),
        model: vehicleModel.trim(),
        year: vehicleYear.trim(),
        licensePlate: licensePlate.trim(),
        color: vehicleColor.trim(),
      };

      // In a real app, you would save this to Firebase/backend
      console.log("Saving vehicle details:", vehicleInfo);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onSuccess();
      onClose();
      Alert.alert("Success", "Vehicle details updated successfully!");
    } catch (error) {
      console.error("Error updating vehicle details:", error);
      Alert.alert("Error", "Failed to update vehicle details");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setVehicleType("");
    setVehicleMake("");
    setVehicleModel("");
    setVehicleYear("");
    setLicensePlate("");
    setVehicleColor("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Vehicle Details</Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              style={[styles.saveButton, loading && styles.disabledButton]}
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vehicle Type *</Text>
              <TextInput
                style={styles.input}
                value={vehicleType}
                onChangeText={setVehicleType}
                placeholder="e.g. Pickup Truck, Van, SUV"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Make</Text>
                <TextInput
                  style={styles.input}
                  value={vehicleMake}
                  onChangeText={setVehicleMake}
                  placeholder="e.g. Ford, Toyota"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Model</Text>
                <TextInput
                  style={styles.input}
                  value={vehicleModel}
                  onChangeText={setVehicleModel}
                  placeholder="e.g. F-150, Camry"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Year</Text>
                <TextInput
                  style={styles.input}
                  value={vehicleYear}
                  onChangeText={setVehicleYear}
                  placeholder="e.g. 2020"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Color</Text>
                <TextInput
                  style={styles.input}
                  value={vehicleColor}
                  onChangeText={setVehicleColor}
                  placeholder="e.g. White, Blue"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>License Plate</Text>
              <TextInput
                style={styles.input}
                value={licensePlate}
                onChangeText={setLicensePlate}
                placeholder="e.g. ABC-1234"
                placeholderTextColor="#9ca3af"
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>
              Why do we need this information?
            </Text>
            <Text style={styles.helpText}>
              • Vehicle details help vendors identify your vehicle{"\n"}•
              License plate helps with security and verification{"\n"}• Vehicle
              type ensures you can handle the pickup load
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1f2937",
    backgroundColor: "white",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  helpSection: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
});
