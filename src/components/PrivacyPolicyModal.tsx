import React from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  visible,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Privacy Policy</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Information We Collect</Text>
            <Text style={styles.sectionText}>
              We collect information you provide directly, such as:{"\n"}•
              Account information (name, email, phone number){"\n"}• Business
              information for vendors{"\n"}• Pickup location and scheduling data
              {"\n"}• Communication preferences
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location Information</Text>
            <Text style={styles.sectionText}>
              With your permission, we collect location data to:{"\n"}• Provide
              accurate pickup addresses{"\n"}
              �� Match vendors with nearby drivers{"\n"}• Optimize pickup routes
              {"\n"}• Verify service completion
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How We Use Your Information</Text>
            <Text style={styles.sectionText}>
              We use your information to:{"\n"}• Provide and improve our
              recycling services{"\n"}• Connect vendors with drivers{"\n"}• Send
              important notifications about pickups{"\n"}• Provide customer
              support{"\n"}• Analyze service usage and optimize performance
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Information Sharing</Text>
            <Text style={styles.sectionText}>
              We share information only as necessary:{"\n"}• With drivers when
              vendors schedule pickups{"\n"}• With vendors when drivers accept
              pickups{"\n"}• With service providers who help operate our
              platform{"\n"}• When required by law or to protect our rights
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Security</Text>
            <Text style={styles.sectionText}>
              We implement appropriate security measures to protect your
              personal information against unauthorized access, alteration,
              disclosure, or destruction. This includes encryption of sensitive
              data and secure authentication methods.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Push Notifications</Text>
            <Text style={styles.sectionText}>
              We send push notifications for:{"\n"}• Pickup confirmations and
              updates{"\n"}• Driver arrival notifications{"\n"}• Service
              completion confirmations{"\n"}• Important account or service
              announcements{"\n\n"}
              You can disable notifications in your device settings at any time.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Retention</Text>
            <Text style={styles.sectionText}>
              We retain your information as long as necessary to provide
              services and comply with legal obligations. You may request
              account deletion by contacting our support team.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Rights</Text>
            <Text style={styles.sectionText}>
              You have the right to:{"\n"}• Access and update your personal
              information{"\n"}• Request deletion of your account{"\n"}• Opt out
              of marketing communications{"\n"}• Contact us with privacy
              concerns
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Changes to This Policy</Text>
            <Text style={styles.sectionText}>
              We may update this Privacy Policy periodically. We will notify you
              of significant changes through the app or by email.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Us</Text>
            <Text style={styles.sectionText}>
              If you have questions about this Privacy Policy, please contact us
              at:{"\n"}
              support@timerecyclingservice.com
            </Text>
          </View>

          <View style={styles.lastUpdated}>
            <Text style={styles.lastUpdatedText}>
              Last updated: January 2025
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
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    flex: 1,
  },
  closeButton: {
    padding: 8,
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
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#4b5563",
  },
  lastUpdated: {
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  lastUpdatedText: {
    fontSize: 14,
    color: "#9ca3af",
    fontStyle: "italic",
  },
});
