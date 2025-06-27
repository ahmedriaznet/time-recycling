import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContextFirebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../config/firebase";
import { BiometricAuth } from "../utils/BiometricAuth";
import { PhoneInput } from "../components/PhoneInput";
import { useNotification } from "../contexts/NotificationContext";

const { width } = Dimensions.get("window");

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: "Welcome to Time Recycling Service",
    description:
      "Streamline your bottle pickup operations with our modern, efficient platform designed for bars, restaurants, and drivers.",
    icon: "wine-outline",
    gradient: ["#667eea", "#764ba2"],
  },
  {
    id: 2,
    title: "Easy Scheduling",
    description:
      "Vendors can quickly schedule pickups while drivers receive instant notifications for new pickup requests.",
    icon: "calendar-outline",
    gradient: ["#f093fb", "#f5576c"],
  },
  {
    id: 3,
    title: "Real-time Tracking",
    description:
      "Track pickup status in real-time, upload photos, and maintain complete pickup history for your business.",
    icon: "location-outline",
    gradient: ["#4facfe", "#00f2fe"],
  },
];

export const OnboardingFlow: React.FC = () => {
  const { user, signIn, signUp } = useAuth();
  const { showNotification } = useNotification();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<"vendor" | "driver" | null>(
    null,
  );
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "+1 ",
    businessName: "",
    businessCategory: "",
    vehicleInfo: "",
  });

  const step = onboardingSteps[currentStep];

  useEffect(() => {
    // Show Firebase ready notification
    const timer = setTimeout(() => {
      if (currentStep === 0 && showOnboarding) {
        console.log("🔥 Firebase authentication ready");
      }
    }, 2000);

    // Check biometric availability
    const checkBiometric = async () => {
      const available = await BiometricAuth.isAvailable();
      const enabled = await BiometricAuth.isBiometricEnabled();
      setBiometricAvailable(available);
      setBiometricEnabled(enabled);
    };

    checkBiometric();

    return () => clearTimeout(timer);
  }, [currentStep, showOnboarding]);

  // If user is authenticated, let parent component handle navigation
  if (user) {
    return null;
  }

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowOnboarding(false);
    }
  };

  const handleSkip = () => setShowOnboarding(false);

  const handleRoleSelect = (role: "vendor" | "driver") => {
    setSelectedRole(role);
    setShowAuth(true);
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      showNotification({
        type: "error",
        title: "Missing Information",
        message: "Please fill in all fields",
      });
      return;
    }

    setLoading(true);
    try {
      await signIn(formData.email, formData.password);
      showNotification({
        type: "success",
        title: "Welcome Back!",
        message: "Successfully signed in to your account.",
      });
    } catch (error: any) {
      showNotification({
        type: "error",
        title: "Sign In Failed",
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      setLoading(true);
      const supportedTypes = await BiometricAuth.getSupportedTypes();
      const authType = supportedTypes[0] || "Biometric";

      const authenticated = await BiometricAuth.authenticate(
        `Sign in with ${authType}`,
      );

      if (authenticated) {
        const credentials = await BiometricAuth.getCredentials();
        if (credentials) {
          await signIn(credentials.email, credentials.password);
        } else {
          showNotification({
            type: "error",
            title: "No Saved Credentials",
            message: "Please sign in manually first to enable biometric login.",
          });
        }
      }
    } catch (error: any) {
      showNotification({
        type: "error",
        title: "Biometric Login Failed",
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      showNotification({
        type: "error",
        title: "Email Required",
        message: "Please enter your email address first.",
      });
      return;
    }

    if (!formData.email.includes("@")) {
      showNotification({
        type: "error",
        title: "Invalid Email",
        message: "Please enter a valid email address.",
      });
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, formData.email);
      showNotification({
        type: "success",
        title: "Password Reset Sent",
        message: `A password reset link has been sent to ${formData.email}. Please check your email.`,
      });
    } catch (error: any) {
      let errorMessage =
        "Failed to send password reset email. Please try again.";

      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many attempts. Please try again later.";
      }

      showNotification({
        type: "error",
        title: "Reset Failed",
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      showNotification({
        type: "error",
        title: "Missing Information",
        message: "Please fill in all required fields",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showNotification({
        type: "error",
        title: "Password Mismatch",
        message: "Passwords do not match",
      });
      return;
    }

    if (formData.password.length < 6) {
      showNotification({
        type: "error",
        title: "Weak Password",
        message: "Password must be at least 6 characters",
      });
      return;
    }

    setLoading(true);
    try {
      const additionalData = {
        name: formData.name,
        phone: formData.phone,
        ...(selectedRole === "vendor"
          ? {
              businessName: formData.businessName,
              businessCategory: formData.businessCategory,
            }
          : {}),
        ...(selectedRole === "driver"
          ? { vehicleInfo: formData.vehicleInfo }
          : {}),
      };

      await signUp(
        formData.email,
        formData.password,
        selectedRole!,
        additionalData,
      );

      showNotification({
        type: "success",
        title: "Account Created!",
        message: `Your ${selectedRole} account has been successfully created.`,
      });

      // Offer biometric setup after successful signup
      const isAvailable = await BiometricAuth.isAvailable();
      if (isAvailable) {
        await BiometricAuth.showSetupPrompt(async () => {
          const success = await BiometricAuth.saveCredentials({
            email: formData.email,
            password: formData.password,
          });
          if (success) {
            showNotification({
              type: "success",
              title: "Biometric Login Enabled",
              message: "You can now sign in using biometric authentication.",
            });
          }
        });
      }
    } catch (error: any) {
      showNotification({
        type: "error",
        title: "Sign Up Failed",
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Authentication Screen
  if (showAuth && selectedRole) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Header */}
              <View style={styles.authHeader}>
                <TouchableOpacity
                  onPress={() => setShowAuth(false)}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>

                <View style={styles.authHeaderContent}>
                  <View style={styles.authIconContainer}>
                    <Ionicons
                      name={
                        selectedRole === "vendor"
                          ? "storefront-outline"
                          : "car-outline"
                      }
                      size={32}
                      color="white"
                    />
                  </View>
                  <Text style={styles.authTitle}>
                    {isLogin ? "Welcome Back" : "Create Account"}
                  </Text>
                  <Text style={styles.authSubtitle}>
                    {isLogin
                      ? "Sign in to your account"
                      : `Create your ${selectedRole} account`}
                  </Text>
                </View>
              </View>

              {/* Form */}
              <View style={styles.formContainer}>
                {!isLogin && (
                  <>
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Full Name *</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="person-outline"
                          size={20}
                          color="rgba(255,255,255,0.7)"
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Enter your full name"
                          placeholderTextColor="rgba(255,255,255,0.5)"
                          value={formData.name}
                          onChangeText={(text) => updateFormData("name", text)}
                        />
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Phone Number</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="call-outline"
                          size={20}
                          color="rgba(255,255,255,0.7)"
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Enter your phone number"
                          placeholderTextColor="rgba(255,255,255,0.5)"
                          value={formData.phone}
                          onChangeText={(text) => updateFormData("phone", text)}
                          keyboardType="phone-pad"
                        />
                      </View>
                    </View>

                    {selectedRole === "vendor" && (
                      <View style={styles.inputContainer}>
                        <Text style={styles.label}>Business Name</Text>
                        <View style={styles.inputWrapper}>
                          <Ionicons
                            name="business-outline"
                            size={20}
                            color="rgba(255,255,255,0.7)"
                          />
                          <TextInput
                            style={styles.input}
                            placeholder="Enter your business name"
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            value={formData.businessName}
                            onChangeText={(text) =>
                              updateFormData("businessName", text)
                            }
                          />
                        </View>
                      </View>
                    )}

                    {selectedRole === "vendor" && (
                      <View style={styles.inputContainer}>
                        <Text style={styles.label}>Phone Number</Text>
                        <PhoneInput
                          showLabel={false}
                          value={formData.phone}
                          onChangeText={(text) => updateFormData("phone", text)}
                          placeholder="Enter your phone number"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.1)",
                            borderColor: "rgba(255,255,255,0.3)",
                          }}
                          textColor="white"
                          placeholderTextColor="rgba(255,255,255,0.5)"
                        />
                      </View>
                    )}

                    {selectedRole === "driver" && (
                      <View style={styles.inputContainer}>
                        <Text style={styles.label}>Vehicle Information</Text>
                        <View style={styles.inputWrapper}>
                          <Ionicons
                            name="car-outline"
                            size={20}
                            color="rgba(255,255,255,0.7)"
                          />
                          <TextInput
                            style={styles.input}
                            placeholder="Enter your vehicle details"
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            value={formData.vehicleInfo}
                            onChangeText={(text) =>
                              updateFormData("vehicleInfo", text)
                            }
                          />
                        </View>
                      </View>
                    )}
                  </>
                )}

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email *</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color="rgba(255,255,255,0.7)"
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={formData.email}
                      onChangeText={(text) => updateFormData("email", text)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password *</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="rgba(255,255,255,0.7)"
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={formData.password}
                      onChangeText={(text) => updateFormData("password", text)}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="rgba(255,255,255,0.7)"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {!isLogin && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Confirm Password *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color="rgba(255,255,255,0.7)"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm your password"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        value={formData.confirmPassword}
                        onChangeText={(text) =>
                          updateFormData("confirmPassword", text)
                        }
                        secureTextEntry={!showPassword}
                      />
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  onPress={isLogin ? handleLogin : handleSignup}
                  style={[styles.submitButton, { opacity: loading ? 0.7 : 1 }]}
                  disabled={loading}
                >
                  <Text style={styles.submitButtonText}>
                    {loading
                      ? "Please wait..."
                      : isLogin
                        ? "Sign In"
                        : "Create Account"}
                  </Text>
                </TouchableOpacity>

                {/* Forgot Password Link - Only show on login screen */}
                {isLogin && (
                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    style={styles.forgotPasswordContainer}
                    disabled={loading}
                  >
                    <Text style={styles.forgotPasswordText}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Biometric Login Button - Only show on login screen */}
                {isLogin && biometricAvailable && biometricEnabled && (
                  <TouchableOpacity
                    onPress={handleBiometricLogin}
                    style={[
                      styles.biometricButton,
                      { opacity: loading ? 0.7 : 1 },
                    ]}
                    disabled={loading}
                  >
                    <Ionicons
                      name="finger-print-outline"
                      size={24}
                      color="white"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.biometricButtonText}>
                      Sign in with Biometrics
                    </Text>
                  </TouchableOpacity>
                )}

                <View style={styles.switchContainer}>
                  <Text style={styles.switchText}>
                    {isLogin
                      ? "Don't have an account? "
                      : "Already have an account? "}
                  </Text>
                  <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                    <Text style={styles.switchLink}>
                      {isLogin ? "Sign Up" : "Sign In"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Onboarding Screens
  if (showOnboarding) {
    return (
      <LinearGradient colors={step.gradient} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.onboardingContainer}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.onboardingContent}>
              <View style={styles.iconContainer}>
                <Ionicons name={step.icon} size={64} color="white" />
              </View>
              <Text style={styles.onboardingTitle}>{step.title}</Text>
              <Text style={styles.onboardingDescription}>
                {step.description}
              </Text>
            </View>

            <View style={styles.onboardingBottom}>
              <View style={styles.dotsContainer}>
                {onboardingSteps.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      { opacity: index === currentStep ? 1 : 0.3 },
                    ]}
                  />
                ))}
              </View>
              <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                <Text style={styles.nextButtonText}>
                  {currentStep === onboardingSteps.length - 1
                    ? "Get Started"
                    : "Next"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Role Selection
  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.roleContainer}>
          <View style={styles.roleHeader}>
            <View style={styles.roleIconContainer}>
              <Ionicons name="wine-outline" size={40} color="white" />
            </View>
            <Text style={styles.roleTitle}>Choose Your Role</Text>
            <Text style={styles.roleSubtitle}>
              How will you be using Time Recycling Service?
            </Text>
          </View>

          <View style={styles.roleCards}>
            <TouchableOpacity
              onPress={() => handleRoleSelect("vendor")}
              style={styles.roleCard}
              activeOpacity={0.8}
            >
              <View style={styles.roleCardContent}>
                <View
                  style={[
                    styles.roleCardIcon,
                    { backgroundColor: "rgba(59, 130, 246, 0.2)" },
                  ]}
                >
                  <Ionicons name="storefront-outline" size={32} color="white" />
                </View>
                <View style={styles.roleCardText}>
                  <Text style={styles.roleCardTitle}>I'm a Vendor</Text>
                  <Text style={styles.roleCardDescription}>
                    Bar, restaurant, or business owner who needs bottle pickup
                    services
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="white" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleRoleSelect("driver")}
              style={styles.roleCard}
              activeOpacity={0.8}
            >
              <View style={styles.roleCardContent}>
                <View
                  style={[
                    styles.roleCardIcon,
                    { backgroundColor: "rgba(34, 197, 94, 0.2)" },
                  ]}
                >
                  <Ionicons name="car-outline" size={32} color="white" />
                </View>
                <View style={styles.roleCardText}>
                  <Text style={styles.roleCardTitle}>I'm a Driver</Text>
                  <Text style={styles.roleCardDescription}>
                    Pickup driver who collects bottles from vendors
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Business Category Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 20,
              padding: 24,
              width: "100%",
              maxWidth: 400,
              maxHeight: "80%",
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
                style={{ fontSize: 20, fontWeight: "bold", color: "#1f2937" }}
              >
                Business Category
              </Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300, marginBottom: 24 }}>
              {[
                "Restaurant",
                "Bar & Pub",
                "Hotel",
                "Cafe & Coffee Shop",
                "Fast Food",
                "Fine Dining",
                "Brewery",
                "Winery",
                "Catering Service",
                "Food Truck",
                "Event Venue",
                "Retail Store",
                "Other",
              ].map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => {
                    updateFormData("businessCategory", category);
                    setShowCategoryModal(false);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    marginBottom: 8,
                    backgroundColor:
                      formData.businessCategory === category
                        ? "#eff6ff"
                        : "transparent",
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor:
                        formData.businessCategory === category
                          ? "#3b82f6"
                          : "#d1d5db",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    {formData.businessCategory === category && (
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: "#3b82f6",
                        }}
                      />
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      color:
                        formData.businessCategory === category
                          ? "#3b82f6"
                          : "#374151",
                      fontWeight:
                        formData.businessCategory === category ? "600" : "400",
                    }}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24 },

  // Onboarding styles
  onboardingContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  headerRow: { flexDirection: "row", justifyContent: "flex-end" },
  skipButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  skipText: { color: "white", fontSize: 14, fontWeight: "600" },
  onboardingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 128,
    height: 128,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  onboardingTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 16,
  },
  onboardingDescription: {
    fontSize: 18,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 28,
  },
  onboardingBottom: { gap: 24 },
  dotsContainer: { flexDirection: "row", justifyContent: "center", gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "white" },
  nextButton: {
    backgroundColor: "white",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
  },
  nextButtonText: { color: "#667eea", fontSize: 18, fontWeight: "bold" },

  // Role selection styles
  roleContainer: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  roleHeader: { alignItems: "center", marginBottom: 48 },
  roleIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  roleTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  roleSubtitle: {
    fontSize: 18,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginTop: 8,
  },
  roleCards: { gap: 24 },
  roleCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  roleCardContent: { flexDirection: "row", alignItems: "center" },
  roleCardIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  roleCardText: { flex: 1 },
  roleCardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  roleCardDescription: { fontSize: 14, color: "rgba(255,255,255,0.8)" },

  // Auth styles
  authHeader: { paddingTop: 16, paddingBottom: 32 },
  backButton: { marginBottom: 24 },
  authHeaderContent: { alignItems: "center" },
  authIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  authSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginTop: 8,
  },
  formContainer: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    marginBottom: 24,
  },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "white", marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  input: { flex: 1, fontSize: 16, color: "white", marginHorizontal: 12 },
  submitButton: {
    backgroundColor: "white",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: { color: "#667eea", fontSize: 18, fontWeight: "bold" },
  biometricButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  biometricButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  forgotPasswordContainer: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  forgotPasswordText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  switchText: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  switchLink: { color: "white", fontSize: 14, fontWeight: "bold" },
});
