import { collection, addDoc } from "firebase/firestore";
import { db, serverTimestamp } from "../config/firebase";
import { FCMPushNotificationService } from "./fcmPushNotificationService";

/**
 * ADMIN NOTIFICATION POLICY:
 * - Admins DO NOT receive notifications for pickup-related events (scheduled, accepted, completed, cancelled)
 * - Admins ONLY receive notifications for new user signups (drivers and vendors awaiting approval)
 * - This keeps admin notifications focused on approval tasks only
 */

export interface PickupNotification {
  id?: string;
  recipientId: string;
  recipientRole: "vendor" | "driver" | "admin";
  type:
    | "pickup_accepted"
    | "pickup_completed"
    | "pickup_cancelled"
    | "pickup_scheduled";
  title: string;
  message: string;
  pickupId: string;
  isRead: boolean;
  createdAt: any;
}

export class PickupNotificationService {
  // Send notification when driver accepts pickup
  static async notifyVendorPickupAccepted(
    vendorId: string,
    pickupId: string,
    driverName: string,
    pickupAddress: string,
  ) {
    try {
      const notification: Omit<PickupNotification, "id"> = {
        recipientId: vendorId,
        recipientRole: "vendor",
        type: "pickup_accepted",
        title: "Pickup Accepted! 🚚",
        message: `${driverName} has accepted your pickup at ${pickupAddress}. They will arrive at the scheduled time.`,
        pickupId,
        isRead: false,
        createdAt: serverTimestamp(),
      };

      // Save in-app notification
      await addDoc(collection(db, "notifications"), notification);

      // Send FCM push notification
      await FCMPushNotificationService.notifyVendorPickupAccepted(
        vendorId,
        driverName,
        pickupAddress,
        pickupId,
      );

      console.log("✅ Vendor notified of pickup acceptance (in-app + push)");
    } catch (error) {
      console.error("❌ Error sending pickup acceptance notification:", error);
    }
  }

  // Send notification when pickup is completed
  static async notifyVendorPickupCompleted(
    vendorId: string,
    pickupId: string,
    driverName: string,
    actualBottleCount: number,
    originalBottleCount: number,
  ) {
    try {
      const notification: Omit<PickupNotification, "id"> = {
        recipientId: vendorId,
        recipientRole: "vendor",
        type: "pickup_completed",
        title: "Pickup Completed! ✅",
        message: `${driverName} has completed your pickup. ${actualBottleCount} bottles collected${actualBottleCount !== originalBottleCount ? ` (estimated: ${originalBottleCount})` : ""}.`,
        pickupId,
        isRead: false,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "notifications"), notification);
      console.log("✅ Vendor notified of pickup completion");
    } catch (error) {
      console.error("❌ Error sending pickup completion notification:", error);
    }
  }

  // Send notification when pickup is cancelled
  static async notifyVendorPickupCancelled(
    vendorId: string,
    pickupId: string,
    driverName: string,
    cancelReason: string,
    pickupAddress: string,
  ) {
    try {
      const notification: Omit<PickupNotification, "id"> = {
        recipientId: vendorId,
        recipientRole: "vendor",
        type: "pickup_cancelled",
        title: "Pickup Cancelled ❌",
        message: `${driverName} has cancelled the pickup at ${pickupAddress}. Reason: ${cancelReason}. Your pickup is now available for other drivers.`,
        pickupId,
        isRead: false,
        createdAt: serverTimestamp(),
      };

      // Create in-app notification
      await addDoc(collection(db, "notifications"), notification);

      // Send push notification
      try {
        await FCMPushNotificationService.notifyVendorPickupCancelled(
          vendorId,
          driverName,
          pickupAddress,
          pickupId,
          cancelReason,
        );
        console.log(
          "📱 Push notification sent to vendor for pickup cancellation",
        );
      } catch (pushError) {
        console.error(
          "❌ Error sending push notification for cancellation:",
          pushError,
        );
        // Don't throw error - in-app notification was successful
      }

      console.log("✅ Vendor notified of pickup cancellation (in-app + push)");
    } catch (error) {
      console.error(
        "❌ Error sending pickup cancellation notification:",
        error,
      );
    }
  }

  // Send notification to all drivers when new pickup is scheduled
  static async notifyDriversNewPickup(
    pickupId: string,
    vendorBusinessName: string,
    pickupAddress: string,
    bottleCount: number,
    urgentPickup: boolean = false,
  ) {
    try {
      // This is a simplified version - in a real app, you'd query for all active drivers
      // For now, we'll just log that notifications would be sent
      console.log(`📢 New pickup notification would be sent to all drivers:
        - Vendor: ${vendorBusinessName}
        - Address: ${pickupAddress}
        - Bottles: ${bottleCount}
        - Urgent: ${urgentPickup ? "Yes" : "No"}
        - Pickup ID: ${pickupId}`);

      // In a real implementation, you would:
      // 1. Query all active drivers
      // 2. Send push notifications to their devices
      // 3. Create in-app notifications for each driver

      console.log("✅ Drivers would be notified of new pickup");
    } catch (error) {
      console.error("❌ Error sending new pickup notifications:", error);
    }
  }
}
