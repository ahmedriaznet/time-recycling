import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
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

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationToken {
  userId: string;
  userRole: "vendor" | "driver" | "admin";
  token: string;
  deviceId: string;
  platform: string;
  createdAt: any;
  updatedAt: any;
}

export class PushNotificationService {
  // Register device for push notifications
  static async registerForPushNotifications(
    userId: string,
    userRole: "vendor" | "driver" | "admin",
  ): Promise<string | null> {
    try {
      // Check if device supports notifications
      if (!Device.isDevice) {
        console.log("Push notifications not supported on simulator");
        return null;
      }

      // Request permission
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Push notification permission denied");
        return null;
      }

      // Get push token (for development, projectId can be omitted)
      const tokenData = await Notifications.getExpoPushTokenAsync();

      const token = tokenData.data;
      console.log("✅ Push token obtained:", token);

      // Save token to Firebase
      await this.saveTokenToFirebase(userId, userRole, token);

      return token;
    } catch (error) {
      console.error("❌ Error registering for push notifications:", error);
      return null;
    }
  }

  // Save notification token to Firebase
  static async saveTokenToFirebase(
    userId: string,
    userRole: "vendor" | "driver" | "admin",
    token: string,
  ) {
    try {
      const deviceId = Device.modelName || "unknown";

      const tokenDoc: NotificationToken = {
        userId,
        userRole,
        token,
        deviceId,
        platform: Platform.OS,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Use userId as document ID to ensure one token per user
      await setDoc(doc(db, "pushTokens", userId), tokenDoc);
      console.log("✅ Push token saved to Firebase");
    } catch (error) {
      console.error("❌ Error saving token to Firebase:", error);
    }
  }

  // Send notification when driver accepts pickup
  static async notifyVendorPickupAccepted(
    vendorId: string,
    driverName: string,
    pickupAddress: string,
    pickupId: string,
  ) {
    try {
      console.log(
        `📱 Sending pickup acceptance notification to vendor ${vendorId}`,
      );
      console.log(
        `📍 Pickup details: Driver: ${driverName}, Address: ${pickupAddress}, ID: ${pickupId}`,
      );

      // Get vendor's push token
      const vendorTokens = await this.getUserTokens(vendorId);
      console.log(`🔑 Found ${vendorTokens.length} push tokens for vendor`);

      if (vendorTokens.length === 0) {
        console.log(
          "❌ No push tokens found for vendor - notifications will not be sent",
        );
        console.log(
          "💡 User may need to log in again to register for push notifications",
        );
        return;
      }

      const notification = {
        to: vendorTokens.map((t) => t.token),
        title: "🚚 Pickup Accepted!",
        body: `${driverName} has accepted your pickup at ${pickupAddress}`,
        data: {
          type: "pickup_accepted",
          pickupId,
          vendorId,
          driverName,
        },
        sound: "default",
        badge: 1,
      };

      console.log("📤 Sending push notification:", notification);

      // Send notification via Expo push service
      await this.sendPushNotification(notification);

      // Save notification to database for in-app display
      await this.saveNotificationToDatabase({
        recipientId: vendorId,
        recipientRole: "vendor",
        type: "pickup_accepted",
        title: notification.title,
        message: notification.body,
        data: notification.data,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      console.log("✅ Vendor notified of pickup acceptance (push + in-app)");
    } catch (error) {
      console.error("❌ Error sending vendor notification:", error);
      console.error("❌ Full error details:", JSON.stringify(error, null, 2));
    }
  }

  // REMOVED: Admin pickup notifications - admins only get signup notifications
  // Send notification when admin needs to know about pickup acceptance
  static async notifyAdminPickupAccepted(
    driverName: string,
    pickupAddress: string,
    pickupId: string,
    vendorId: string,
  ) {
    // DISABLED: Admins no longer receive pickup notifications
    console.log(
      `📱 Admin pickup notifications disabled - only signup notifications allowed`,
    );
    return;

    try {
      console.log(`📱 Sending pickup acceptance notification to admin`);

      // Get admin's push tokens (look for admin role users)
      const adminTokens = await this.getAdminTokens();
      console.log(`🔑 Found ${adminTokens.length} admin push tokens`);

      if (adminTokens.length === 0) {
        console.log(
          "❌ No push tokens found for admin - notifications will not be sent",
        );
        return;
      }

      const notification = {
        to: adminTokens.map((t) => t.token),
        title: "🚛 Driver Assigned",
        body: `${driverName} accepted pickup at ${pickupAddress}`,
        data: {
          type: "admin_pickup_accepted",
          pickupId,
          vendorId,
          driverName,
        },
        sound: "default",
        badge: 1,
      };

      console.log("📤 Sending admin push notification:", notification);

      // Send notification via Expo push service
      await this.sendPushNotification(notification);

      // Save notification to database for in-app display
      await this.saveNotificationToDatabase({
        recipientId: "admin",
        recipientRole: "admin",
        type: "pickup_accepted",
        title: notification.title,
        message: notification.body,
        data: notification.data,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      console.log("✅ Admin notified of pickup acceptance (push + in-app)");
    } catch (error) {
      console.error("❌ Error sending admin notification:", error);
      console.error("❌ Full error details:", JSON.stringify(error, null, 2));
    }
  }

  // Get admin user tokens
  static async getAdminTokens(): Promise<NotificationToken[]> {
    try {
      const tokensQuery = query(
        collection(db, "pushTokens"),
        where("userRole", "==", "admin"),
      );

      const snapshot = await getDocs(tokensQuery);
      return snapshot.docs.map((doc) => doc.data() as NotificationToken);
    } catch (error) {
      console.error("Error getting admin tokens:", error);
      return [];
    }
  }

  // Send daily reminder notifications to drivers
  static async sendDriverPickupReminders() {
    try {
      console.log("📱 Sending pickup reminders to drivers");

      // Get all drivers with pickups tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // Query pickups for tomorrow
      const pickupsQuery = query(
        collection(db, "pickups"),
        where("status", "==", "assigned"),
        where("scheduledDate", ">=", tomorrow),
        where("scheduledDate", "<", dayAfterTomorrow),
      );

      const pickupsSnapshot = await getDocs(pickupsQuery);
      const pickupsData = pickupsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Group pickups by driver
      const driverPickups = pickupsData.reduce((acc: any, pickup: any) => {
        if (pickup.driverId) {
          if (!acc[pickup.driverId]) {
            acc[pickup.driverId] = [];
          }
          acc[pickup.driverId].push(pickup);
        }
        return acc;
      }, {});

      // Send notifications to each driver
      for (const [driverId, pickups] of Object.entries(driverPickups)) {
        await this.notifyDriverPickupReminder(driverId, pickups as any[]);
      }

      console.log(
        `✅ Sent pickup reminders to ${Object.keys(driverPickups).length} drivers`,
      );
    } catch (error) {
      console.error("❌ Error sending driver reminders:", error);
    }
  }

  // Send pickup reminder to specific driver
  static async notifyDriverPickupReminder(driverId: string, pickups: any[]) {
    try {
      const driverTokens = await this.getUserTokens(driverId);

      if (driverTokens.length === 0) {
        console.log(`No push tokens found for driver ${driverId}`);
        return;
      }

      const pickupCount = pickups.length;
      const firstPickup = pickups[0];

      const notification = {
        to: driverTokens.map((t) => t.token),
        title: "📅 Pickup Reminder",
        body:
          pickupCount === 1
            ? `You have a pickup tomorrow at ${firstPickup.address}`
            : `You have ${pickupCount} pickups scheduled for tomorrow`,
        data: {
          type: "pickup_reminder",
          driverId,
          pickupCount,
          pickups: pickups.map((p) => p.id),
        },
        sound: "default",
        badge: pickupCount,
      };

      await this.sendPushNotification(notification);

      // Save notification to database
      await this.saveNotificationToDatabase({
        recipientId: driverId,
        recipientRole: "driver",
        type: "pickup_reminder",
        title: notification.title,
        message: notification.body,
        data: notification.data,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      console.log(`✅ Sent pickup reminder to driver ${driverId}`);
    } catch (error) {
      console.error(`❌ Error sending reminder to driver ${driverId}:`, error);
    }
  }

  // Get user's push tokens
  static async getUserTokens(userId: string): Promise<NotificationToken[]> {
    try {
      const tokensQuery = query(
        collection(db, "pushTokens"),
        where("userId", "==", userId),
      );

      const snapshot = await getDocs(tokensQuery);
      return snapshot.docs.map((doc) => doc.data() as NotificationToken);
    } catch (error) {
      console.error("Error getting user tokens:", error);
      return [];
    }
  }

  // Send push notification via Expo
  static async sendPushNotification(notification: any) {
    try {
      const message = {
        to: notification.to,
        sound: "default",
        title: notification.title,
        body: notification.body,
        data: notification.data,
        badge: notification.badge || 1,
      };

      console.log("📨 Sending to Expo push service:", {
        tokensCount: Array.isArray(message.to) ? message.to.length : 1,
        title: message.title,
        body: message.body,
      });

      // Send to Expo's push notification service
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("✅ Push notification API response:", result);

      // Check for any errors in the response
      if (Array.isArray(result.data)) {
        result.data.forEach((item: any, index: number) => {
          if (item.status === "error") {
            console.error(
              `❌ Push notification error for token ${index}:`,
              item,
            );
          } else {
            console.log(
              `✅ Push notification sent for token ${index}:`,
              item.status,
            );
          }
        });
      }
    } catch (error) {
      console.error("❌ Error sending push notification:", error);
      console.error("❌ Full error details:", JSON.stringify(error, null, 2));
    }
  }

  // Save notification to database for in-app display
  static async saveNotificationToDatabase(notification: any) {
    try {
      await addDoc(collection(db, "notifications"), notification);
    } catch (error) {
      console.error("Error saving notification to database:", error);
    }
  }

  // Schedule daily reminder notifications (call this once to set up)
  static async scheduleDailyReminders() {
    try {
      // Cancel existing scheduled notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Schedule daily notification at 8 PM to check for tomorrow's pickups
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Pickup Reminder Check",
          body: "Checking for tomorrow's pickups...",
        },
        trigger: {
          hour: 20, // 8 PM
          minute: 0,
          repeats: true,
        },
      });

      console.log("✅ Daily reminder notifications scheduled");
    } catch (error) {
      console.error("❌ Error scheduling daily reminders:", error);
    }
  }

  // Listen for notification responses (when user taps notification)
  static setupNotificationListeners() {
    // Handle notification when app is running
    Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notification received:", notification);
    });

    // Handle notification tap
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification tapped:", response);

      const data = response.notification.request.content.data;

      // Handle different notification types
      if (data?.type === "pickup_accepted" && data?.pickupId) {
        // Navigate to pickup details or dashboard
        console.log("Navigate to pickup details:", data.pickupId);
      } else if (data?.type === "pickup_reminder") {
        // Navigate to driver's pickup list
        console.log("Navigate to driver pickups");
      }
    });
  }
}
