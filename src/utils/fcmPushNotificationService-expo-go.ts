import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === "expo";

export interface FCMNotificationToken {
  userId: string;
  userRole: "vendor" | "driver" | "admin";
  token: string;
  deviceId: string;
  platform: string;
  createdAt: any;
  updatedAt: any;
}

export class FCMPushNotificationService {
  // Request permissions for notifications
  static async requestPermissions(): Promise<boolean> {
    try {
      if (isExpoGo) {
        // Use Expo Notifications for Expo Go
        const { status } = await Notifications.requestPermissionsAsync();
        return status === "granted";
      } else {
        // Use React Native Firebase for development builds
        const messaging = await import("@react-native-firebase/messaging");
        const authStatus = await messaging.default().requestPermission();
        const enabled =
          authStatus === messaging.default.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.default.AuthorizationStatus.PROVISIONAL;
        return enabled;
      }
    } catch (error) {
      console.error("❌ Error requesting notification permissions:", error);
      return false;
    }
  }

  // Get FCM token
  static async getToken(): Promise<string | null> {
    try {
      if (isExpoGo) {
        // Use Expo push tokens for Expo Go
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        return token.data;
      } else {
        // Use Firebase messaging for development builds
        const messaging = await import("@react-native-firebase/messaging");
        return await messaging.default().getToken();
      }
    } catch (error) {
      console.error("❌ Error getting notification token:", error);
      return null;
    }
  }

  // Setup background message handler
  static setupBackgroundHandler(): void {
    if (isExpoGo) {
      console.log("📱 Background handler setup (Expo Go mode)");
      // Expo Go handles this automatically
    } else {
      // Use React Native Firebase for development builds
      import("@react-native-firebase/messaging").then((messaging) => {
        messaging
          .default()
          .setBackgroundMessageHandler(async (remoteMessage) => {
            console.log("📱 Message handled in the background!", remoteMessage);
          });
      });
    }
  }

  // Setup foreground listener
  static setupForegroundListener(): () => void {
    if (isExpoGo) {
      console.log("📱 Foreground listener setup (Expo Go mode)");

      // Setup Expo notification listeners
      const subscription = Notifications.addNotificationReceivedListener(
        (notification) => {
          console.log("📱 Notification received in foreground:", notification);
        },
      );

      return () => subscription.remove();
    } else {
      // Use React Native Firebase for development builds
      let unsubscribe: (() => void) | null = null;

      import("@react-native-firebase/messaging").then((messaging) => {
        unsubscribe = messaging.default().onMessage(async (remoteMessage) => {
          console.log(
            "📱 A new FCM message arrived in foreground!",
            remoteMessage,
          );
        });
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }

  // Send test notification
  static async sendTestNotification(
    userId: string,
    userRole: "vendor" | "driver" | "admin",
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (isExpoGo) {
        // Schedule a local notification for Expo Go
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "🧪 Test Notification (Expo Go)",
            body: "Your notifications are working correctly in Expo Go!",
            data: { test: true },
          },
          trigger: { seconds: 1 },
        });

        return {
          success: true,
          message: "Test notification scheduled in Expo Go mode",
        };
      } else {
        // Use the existing Firebase implementation for development builds
        // Create a notification document in Firestore
        await addDoc(collection(db, "notifications"), {
          recipientId: userId,
          recipientRole: userRole,
          type: "test_notification",
          title: "🧪 Test Notification",
          message: "Your notifications are working correctly!",
          isRead: false,
          createdAt: serverTimestamp(),
        });

        return {
          success: true,
          message: "Test notification sent via Firebase",
        };
      }
    } catch (error) {
      console.error("❌ Error sending test notification:", error);
      return {
        success: false,
        message: "Failed to send test notification",
      };
    }
  }

  // Register for push notifications
  static async registerForPushNotifications(
    userId: string,
  ): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log("❌ Notification permissions not granted");
        return null;
      }

      const token = await this.getToken();
      if (!token) {
        console.log("❌ Failed to get notification token");
        return null;
      }

      console.log("✅ Notification token obtained:", token);
      return token;
    } catch (error) {
      console.error("❌ Error registering for push notifications:", error);
      return null;
    }
  }
}
