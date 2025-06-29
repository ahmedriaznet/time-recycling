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

interface TermsOfServiceModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({
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
            <Text style={styles.headerTitle}>Terms of Service</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Agreement to Terms</Text>
            <Text style={styles.sectionText}>
              By using Time Recycling Service, you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do
              not use our service.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Service Description</Text>
            <Text style={styles.sectionText}>
              Time Recycling Service connects vendors who need bottle pickup
              services with drivers who provide collection services. We
              facilitate this marketplace but do not directly provide pickup
              services.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. User Responsibilities</Text>
            <Text style={styles.sectionText}>
              • Vendors must provide accurate pickup information and bottle
              counts{"\n"}• Drivers must arrive at scheduled times and handle
              materials safely{"\n"}• All users must treat each other with
              respect and professionalism{"\n"}• Users are responsible for
              compliance with local recycling regulations
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Account Security</Text>
            <Text style={styles.sectionText}>
              You are responsible for maintaining the security of your account
              and password. You must notify us immediately of any unauthorized
              access to your account.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Service Availability</Text>
            <Text style={styles.sectionText}>
              We strive to maintain service availability but cannot guarantee
              uninterrupted access. We may modify or discontinue features with
              reasonable notice.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
            <Text style={styles.sectionText}>
              Time Recycling Service is not liable for any damages arising from
              the use of our platform or interactions between vendors and
              drivers. Our liability is limited to the maximum extent permitted
              by law.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Privacy and Data</Text>
            <Text style={styles.sectionText}>
              Your privacy is important to us. Please review our Privacy Policy
              to understand how we collect, use, and protect your information.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Contact Information</Text>
            <Text style={styles.sectionText}>
              For questions about these Terms of Service, please contact us at:
              {"\n"}
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
