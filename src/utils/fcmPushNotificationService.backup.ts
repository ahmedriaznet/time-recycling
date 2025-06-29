import messaging from "@react-native-firebase/messaging";
import { Platform, PermissionsAndroid } from "react-native";
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
      if (Platform.OS === "android" && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: "Notification Permission",
            message:
              "This app needs permission to send you push notifications about pickup updates.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log("❌ Android notification permission denied");
          return false;
        }
      }

      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log("✅ Notification permissions granted:", authStatus);
      } else {
        console.log("❌ Notification permissions denied:", authStatus);
      }

      return enabled;
    } catch (error) {
      console.error("❌ Error requesting notification permissions:", error);
      return false;
    }
  }

  // Get FCM token
  static async getToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      console.log("✅ FCM Token obtained:", token);
      return token;
    } catch (error) {
      console.error("❌ Error getting FCM token:", error);
      return null;
    }
  }

  // Save FCM token to Firestore
  static async saveTokenToFirestore(
    userId: string,
    userRole: "vendor" | "driver" | "admin",
    token: string,
  ): Promise<boolean> {
    try {
      const tokenData: FCMNotificationToken = {
        userId,
        userRole,
        token,
        deviceId: Platform.OS, // Simple device identifier
        platform: Platform.OS,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "fcmTokens", userId), tokenData);
      console.log("✅ FCM token saved to Firestore");
      return true;
    } catch (error) {
      console.error("❌ Error saving FCM token to Firestore:", error);
      return false;
    }
  }

  // Setup background message handler
  static setupBackgroundHandler(): void {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log("📱 Message handled in the background!", remoteMessage);

      // Create notification document in Firestore for in-app display
      try {
        if (remoteMessage.data?.recipientId && remoteMessage.data?.type) {
          await addDoc(collection(db, "notifications"), {
            recipientId: remoteMessage.data.recipientId,
            recipientRole: remoteMessage.data.recipientRole || "vendor",
            type: remoteMessage.data.type,
            title: remoteMessage.notification?.title || "Notification",
            message:
              remoteMessage.notification?.body || "You have a new update",
            isRead: false,
            createdAt: serverTimestamp(),
          });
          console.log("✅ Background notification saved to Firestore");
        }
      } catch (error) {
        console.error("❌ Error handling background message:", error);
      }
    });
  }

  // Setup foreground listener
  static setupForegroundListener(): () => void {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log("📱 A new FCM message arrived in foreground!", remoteMessage);

      // Create notification document in Firestore for in-app display
      try {
        if (remoteMessage.data?.recipientId && remoteMessage.data?.type) {
          await addDoc(collection(db, "notifications"), {
            recipientId: remoteMessage.data.recipientId,
            recipientRole: remoteMessage.data.recipientRole || "vendor",
            type: remoteMessage.data.type,
            title: remoteMessage.notification?.title || "Notification",
            message:
              remoteMessage.notification?.body || "You have a new update",
            isRead: false,
            createdAt: serverTimestamp(),
          });
          console.log("✅ Foreground notification saved to Firestore");
        }
      } catch (error) {
        console.error("❌ Error handling foreground message:", error);
      }
    });

    return unsubscribe;
  }

  // Get all FCM tokens for a specific role
  static async getTokensForRole(
    role: "vendor" | "driver" | "admin",
  ): Promise<FCMNotificationToken[]> {
    try {
      const q = query(
        collection(db, "fcmTokens"),
        where("userRole", "==", role),
      );
      const querySnapshot = await getDocs(q);
      const tokens: FCMNotificationToken[] = [];

      querySnapshot.forEach((doc) => {
        tokens.push(doc.data() as FCMNotificationToken);
      });

      console.log(`✅ Found ${tokens.length} tokens for role: ${role}`);
      return tokens;
    } catch (error) {
      console.error(`❌ Error getting tokens for role ${role}:`, error);
      return [];
    }
  }

  // Send test notification
  static async sendTestNotification(
    userId: string,
    userRole: "vendor" | "driver" | "admin",
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Create a notification document in Firestore (for in-app display)
      await addDoc(collection(db, "notifications"), {
        recipientId: userId,
        recipientRole: userRole,
        type: "test_notification",
        title: "🧪 Test Notification",
        message:
          "Your notifications are working correctly! This is a test message to verify your notification system.",
        isRead: false,
        createdAt: serverTimestamp(),
      });

      console.log("✅ Test notification saved to Firestore");

      return {
        success: true,
        message:
          "Test notification sent successfully! Check your notification panel.",
      };
    } catch (error) {
      console.error("❌ Error sending test notification:", error);
      return {
        success: false,
        message: "Failed to send test notification. Please try again.",
      };
    }
  }

  // Register for push notifications (main method)
  static async registerForPushNotifications(
    userId: string,
    userRole: "vendor" | "driver" | "admin" = "vendor",
  ): Promise<string | null> {
    try {
      console.log(
        `🔔 Registering for push notifications - User: ${userId}, Role: ${userRole}`,
      );

      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log("❌ Push notification permissions not granted");
        return null;
      }

      // Get FCM token
      const token = await this.getToken();
      if (!token) {
        console.log("❌ Failed to get FCM token");
        return null;
      }

      // Save token to Firestore
      const saved = await this.saveTokenToFirestore(userId, userRole, token);
      if (!saved) {
        console.log("❌ Failed to save FCM token to Firestore");
        return null;
      }

      console.log("✅ Successfully registered for push notifications");
      return token;
    } catch (error) {
      console.error("❌ Error registering for push notifications:", error);
      return null;
    }
  }
}
