import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

const BIOMETRIC_CREDENTIALS_KEY = "biometric_credentials";
const BIOMETRIC_ENABLED_KEY = "biometric_enabled";

export interface BiometricCredentials {
  email: string;
  password: string;
}

export class BiometricAuth {
  // Check if device supports biometric authentication
  static async isAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    } catch (error) {
      console.error("Error checking biometric availability:", error);
      return false;
    }
  }

  // Get supported authentication types
  static async getSupportedTypes(): Promise<string[]> {
    try {
      const types =
        await LocalAuthentication.supportedAuthenticationTypesAsync();
      const supportedTypes: string[] = [];

      if (
        types.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
        )
      ) {
        supportedTypes.push("Face ID");
      }
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        supportedTypes.push("Touch ID");
      }
      if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        supportedTypes.push("Iris");
      }

      return supportedTypes;
    } catch (error) {
      console.error("Error getting supported types:", error);
      return [];
    }
  }

  // Authenticate with biometrics
  static async authenticate(
    reason: string = "Please authenticate to sign in",
  ): Promise<boolean> {
    try {
      console.log("🔐 Starting biometric authentication...");

      // Check what's available first
      const available = await this.isAvailable();
      const types = await this.getSupportedTypes();
      console.log("📱 Biometric available:", available);
      console.log("🎯 Supported types:", types);

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: "Cancel",
        fallbackLabel: "Use Password",
        disableDeviceFallback: false,
      });

      console.log("✅ Authentication result:", result);
      return result.success;
    } catch (error) {
      console.error("❌ Biometric authentication error:", error);
      return false;
    }
  }

  // Save credentials for biometric login
  static async saveCredentials(
    credentials: BiometricCredentials,
  ): Promise<boolean> {
    try {
      const credentialsJson = JSON.stringify(credentials);
      await SecureStore.setItemAsync(
        BIOMETRIC_CREDENTIALS_KEY,
        credentialsJson,
      );
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");
      return true;
    } catch (error) {
      console.error("Error saving biometric credentials:", error);
      return false;
    }
  }

  // Get saved credentials after biometric authentication
  static async getCredentials(): Promise<BiometricCredentials | null> {
    try {
      const credentialsJson = await SecureStore.getItemAsync(
        BIOMETRIC_CREDENTIALS_KEY,
      );
      if (credentialsJson) {
        return JSON.parse(credentialsJson);
      }
      return null;
    } catch (error) {
      console.error("Error getting biometric credentials:", error);
      return null;
    }
  }

  // Check if biometric login is enabled
  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      return enabled === "true";
    } catch (error) {
      console.error("Error checking biometric enabled status:", error);
      return false;
    }
  }

  // Enable/disable biometric login
  static async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled.toString());
      if (!enabled) {
        // Remove saved credentials when disabled
        await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      }
    } catch (error) {
      console.error("Error setting biometric enabled status:", error);
    }
  }

  // Clear all biometric data
  static async clearBiometricData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    } catch (error) {
      console.error("Error clearing biometric data:", error);
    }
  }

  // Show biometric setup prompt
  static async showSetupPrompt(onSetup: () => void): Promise<void> {
    const supportedTypes = await this.getSupportedTypes();
    const authType = supportedTypes[0] || "Biometric";

    Alert.alert(
      `Enable ${authType} Login?`,
      `Use ${authType} to sign in quickly and securely without typing your password.`,
      [
        {
          text: "Not Now",
          style: "cancel",
        },
        {
          text: `Enable ${authType}`,
          onPress: onSetup,
        },
      ],
    );
  }
}
