import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  getDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  deleteField,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { PickupNotificationService } from "../utils/pickupNotifications";
import EmailService from "../services/emailService";

export interface Pickup {
  id: string;
  vendorId: string;
  vendorName?: string;
  vendorBusinessName?: string;
  driverId?: string;
  driverName?: string;
  scheduledDate: string;
  bottleCount: number;
  actualBottleCount?: number;
  status: "pending" | "assigned" | "in-progress" | "completed" | "cancelled";
  notes?: string;
  createdAt: string;
  completedAt?: string;
  assignedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  address?: string;
  contactPhone?: string;
  urgentPickup?: boolean;
  proofPhoto?: string;
  hiddenByDrivers?: string[]; // Array of driver IDs who hid this pickup
  acceptedByDriver?: boolean;
}

interface FirebasePickupStoreContextType {
  pickups: Pickup[];
  addPickup: (pickup: Omit<Pickup, "id" | "createdAt">) => Promise<void>;
  updatePickup: (id: string, updates: Partial<Pickup>) => Promise<void>;
  getPickupsForVendor: (vendorId: string) => Pickup[];
  getPickupsForDriver: (driverId: string) => Pickup[];
  getCancellationsForDriver: (driverId: string) => any[];
  getAvailablePickups: (driverId: string) => Pickup[];
  getAllAvailablePickups: (driverId: string) => Pickup[]; // Includes hidden pickups
  acceptPickup: (
    pickupId: string,
    driverId: string,
    driverName: string,
  ) => Promise<void>;
  hidePickup: (pickupId: string, driverId: string) => Promise<void>;
  unhidePickup: (pickupId: string, driverId: string) => Promise<void>;
  cancelPickup: (pickupId: string, reason: string) => Promise<void>;
  completePickup: (
    pickupId: string,
    actualBottleCount: number,
    proofPhoto: string,
  ) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const FirebasePickupStoreContext = createContext<
  FirebasePickupStoreContextType | undefined
>(undefined);

export const FirebasePickupStoreProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [cancellations, setCancellations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); // Don't block UI render
  const [error, setError] = useState<string | null>(null);

  // Set up real-time Firebase listeners
  useEffect(() => {
    setupFirebaseListener();
    setupCancellationsListener();
  }, []);

  const setupFirebaseListener = () => {
    try {
      console.log("Setting up real-time listener for pickups...");

      // Create query for all pickups, ordered by creation date
      const pickupsQuery = query(
        collection(db, "pickups"),
        orderBy("createdAt", "desc"),
      );

      // Set up real-time listener
      const unsubscribe = onSnapshot(
        pickupsQuery,
        (snapshot) => {
          console.log(
            `✅ Firebase listener: Received ${snapshot.size} pickups`,
          );

          const firebasePickups = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // Convert Firestore timestamps to ISO strings
              createdAt:
                data.createdAt instanceof Timestamp
                  ? data.createdAt.toDate().toISOString()
                  : data.createdAt,
              completedAt:
                data.completedAt instanceof Timestamp
                  ? data.completedAt.toDate().toISOString()
                  : data.completedAt,
              scheduledDate:
                data.scheduledDate instanceof Timestamp
                  ? data.scheduledDate.toDate().toISOString()
                  : data.scheduledDate,
            } as Pickup;
          });

          setPickups(firebasePickups);
          setLoading(false);
          setError(null);
        },
        (error) => {
          console.error("❌ Firebase listener error:", error);
          setError(`Firebase sync error: ${error.message}`);
          setLoading(false);
        },
      );

      // Return cleanup function
      return () => {
        console.log("Cleaning up listener");
        unsubscribe();
      };
    } catch (error) {
      console.error("❌ Failed to setup Firebase listener:", error);
      setError(`Failed to connect to Firebase: ${error.message}`);
      setLoading(false);
    }
  };

  const addPickup = async (pickupData: Omit<Pickup, "id" | "createdAt">) => {
    try {
      console.log("Adding pickup...");

      const docRef = await addDoc(collection(db, "pickups"), {
        ...pickupData,
        createdAt: serverTimestamp(),
        scheduledDate: new Date(pickupData.scheduledDate),
      });

      console.log("✅ Pickup added to Firebase with ID:", docRef.id);

      // Notify drivers of new pickup
      await PickupNotificationService.notifyDriversNewPickup(
        docRef.id,
        pickupData.vendorBusinessName ||
          pickupData.vendorName ||
          "Unknown Vendor",
        pickupData.address || "Unknown Address",
        pickupData.bottleCount,
        pickupData.urgentPickup,
      );

      // Send email to all available drivers
      try {
        // Get all driver emails from Firestore (simplified for demo)
        const driversSnapshot = await getDocs(
          query(
            collection(db, "users"),
            where("role", "==", "driver"),
            where("approvalStatus", "==", "approved"),
          ),
        );

        console.log(
          `📧 Sending pickup emails to ${driversSnapshot.size} drivers`,
        );

        // Send email to each driver
        for (const driverDoc of driversSnapshot.docs) {
          const driverData = driverDoc.data();
          if (driverData.email) {
            await EmailService.notifyDriverNewPickup(driverData.email, {
              pickupId: docRef.id,
              vendorName:
                pickupData.vendorBusinessName ||
                pickupData.vendorName ||
                "Unknown Vendor",
              address: pickupData.address || "Unknown Address",
              bottleCount: pickupData.bottleCount,
              scheduledDate: pickupData.scheduledDate,
              notes: pickupData.notes,
            });
          }
        }
      } catch (emailError) {
        console.error("Error sending driver emails:", emailError);
      }
    } catch (error) {
      console.error("❌ Error adding pickup to Firebase:", error);
      setError(`Failed to add pickup: ${error.message}`);
      throw error;
    }
  };

  const updatePickup = async (id: string, updates: Partial<Pickup>) => {
    try {
      console.log("Updating pickup...");

      const pickupRef = doc(db, "pickups", id);
      const firebaseUpdates = { ...updates };

      // Convert date strings to Firebase timestamps if needed
      if (updates.completedAt) {
        firebaseUpdates.completedAt = new Date(updates.completedAt);
      }
      if (updates.scheduledDate) {
        firebaseUpdates.scheduledDate = new Date(updates.scheduledDate);
      }

      await updateDoc(pickupRef, firebaseUpdates);
      console.log("✅ Pickup updated in Firebase");
    } catch (error) {
      console.error("❌ Error updating pickup in Firebase:", error);
      setError(`Failed to update pickup: ${error.message}`);
      throw error;
    }
  };

  const getPickupsForVendor = (vendorId: string) => {
    return pickups.filter((pickup) => pickup.vendorId === vendorId);
  };

  const setupCancellationsListener = () => {
    try {
      const cancellationsCollection = collection(db, "cancellations");

      const unsubscribe = onSnapshot(
        cancellationsCollection,
        (snapshot) => {
          const cancellationData: any[] = [];
          snapshot.forEach((doc) => {
            cancellationData.push({
              id: doc.id,
              ...doc.data(),
            });
          });

          // Sort by cancelledAt in memory
          cancellationData.sort(
            (a, b) =>
              new Date(b.cancelledAt || 0).getTime() -
              new Date(a.cancelledAt || 0).getTime(),
          );

          setCancellations(cancellationData);
        },
        (error) => {
          console.error("❌ Error in cancellations listener:", error);
          setCancellations([]);
        },
      );

      return unsubscribe;
    } catch (error) {
      console.error("❌ Error setting up cancellations listener:", error);
      setCancellations([]);
    }
  };
  const getPickupsForDriver = (driverId: string) => {
    return pickups.filter(
      (pickup) => pickup.driverId === driverId && pickup.status !== "cancelled",
    );
  };
  const getCancellationsForDriver = (driverId: string) => {
    return cancellations.filter(
      (cancellation) => cancellation.driverId === driverId,
    );
  };
  const getAvailablePickups = (driverId: string) => {
    return pickups.filter(
      (pickup) =>
        pickup.status === "pending" &&
        !pickup.hiddenByDrivers?.includes(driverId),
    );
  };

  const getAllAvailablePickups = (driverId: string) => {
    return pickups.filter((pickup) => pickup.status === "pending");
  };
  const acceptPickup = async (
    pickupId: string,
    driverId: string,
    driverName: string,
  ) => {
    try {
      console.log("🚚 Driver accepting pickup:", pickupId);

      const pickup = pickups.find((p) => p.id === pickupId);
      if (!pickup) throw new Error("Pickup not found");

      await updatePickup(pickupId, {
        status: "assigned",
        driverId,
        driverName,
        assignedAt: new Date().toISOString(),
        acceptedByDriver: true,
        // Clear cancellation fields when re-accepting
        cancelledAt: deleteField(),
        cancelReason: deleteField(),
      });

      // Notify vendor of pickup acceptance
      await PickupNotificationService.notifyVendorPickupAccepted(
        pickup.vendorId,
        pickupId,
        driverName,
        pickup.address || "Unknown Address",
      );

      // Send email to vendor
      try {
        const vendorDoc = await getDoc(doc(db, "users", pickup.vendorId));
        const driverDoc = await getDoc(doc(db, "users", driverId));

        if (vendorDoc.exists() && vendorDoc.data().email) {
          const vendorData = vendorDoc.data();
          const driverData = driverDoc.exists() ? driverDoc.data() : null;

          await EmailService.notifyVendorPickupAccepted(vendorData.email, {
            pickupId,
            driverName,
            driverPhone: driverData?.phone || "Contact via app",
            scheduledDate: pickup.scheduledDate,
            address: pickup.address || "Unknown Address",
            bottleCount: pickup.bottleCount,
          });

          console.log(
            "📧 Pickup acceptance email sent to vendor:",
            vendorData.email,
          );
        }
      } catch (emailError) {
        console.error("Error sending vendor email:", emailError);
      }

      console.log("✅ Pickup accepted, vendor notified via push and email");
    } catch (error) {
      console.error("❌ Error accepting pickup:", error);
      throw error;
    }
  };

  const hidePickup = async (pickupId: string, driverId: string) => {
    try {
      console.log("🙈 Driver hiding pickup:", pickupId);

      const pickup = pickups.find((p) => p.id === pickupId);
      if (!pickup) throw new Error("Pickup not found");

      const hiddenByDrivers = pickup.hiddenByDrivers || [];
      if (!hiddenByDrivers.includes(driverId)) {
        hiddenByDrivers.push(driverId);
        await updatePickup(pickupId, { hiddenByDrivers });
      }
    } catch (error) {
      console.error("❌ Error hiding pickup:", error);
      throw error;
    }
  };

  const unhidePickup = async (pickupId: string, driverId: string) => {
    try {
      console.log("👀 Driver unhiding pickup:", pickupId);

      const pickup = pickups.find((p) => p.id === pickupId);
      if (!pickup) throw new Error("Pickup not found");

      const hiddenByDrivers = pickup.hiddenByDrivers || [];
      const updatedHiddenByDrivers = hiddenByDrivers.filter(
        (id) => id !== driverId,
      );
      await updatePickup(pickupId, { hiddenByDrivers: updatedHiddenByDrivers });
    } catch (error) {
      console.error("❌ Error unhiding pickup:", error);
      throw error;
    }
  };

  const cancelPickup = async (pickupId: string, reason: string) => {
    try {
      console.log("❌ Starting cancellation for pickup:", pickupId);

      const pickup = pickups.find((p) => p.id === pickupId);
      if (!pickup) {
        throw new Error("Pickup not found");
      }

      console.log("📋 Found pickup, proceeding with cancellation...");

      // Store original driver info
      const originalDriverId = pickup.driverId;
      const originalDriverName = pickup.driverName;

      // Create a separate cancellation record
      const cancellationRecord = {
        pickupId,
        originalPickupData: {
          vendorId: pickup.vendorId,
          vendorName: pickup.vendorName,
          vendorBusinessName: pickup.vendorBusinessName,
          address: pickup.address,
          scheduledDate: pickup.scheduledDate,
          bottleCount: pickup.bottleCount,
          notes: pickup.notes,
        },
        driverId: originalDriverId,
        driverName: originalDriverName,
        cancelledAt: new Date().toISOString(),
        cancelReason: reason,
        type: "cancellation",
      };

      // Add cancellation record to Firebase
      await addDoc(collection(db, "cancellations"), cancellationRecord);
      // Reset pickup to pending status (remove driver assignment)
      await updatePickup(pickupId, {
        status: "pending",
        driverId: deleteField(),
        driverName: deleteField(),
        assignedAt: deleteField(),
      });

      // Try to notify vendor (but don't fail if this doesn't work)
      try {
        if (originalDriverName) {
          await PickupNotificationService.notifyVendorPickupCancelled(
            pickup.vendorId,
            pickupId,
            originalDriverName,
            reason,
            pickup.address || "Unknown Address",
          );
        }
      } catch (notificationError) {
        console.warn("⚠️ Vendor notification failed:", notificationError);
        // Continue anyway - cancellation worked
      }

      // Try to send email (but don't fail if this doesn't work)
      try {
        if (originalDriverName) {
          const vendorDoc = await getDoc(doc(db, "users", pickup.vendorId));
          if (vendorDoc.exists() && vendorDoc.data().email) {
            const vendorData = vendorDoc.data();
            await EmailService.notifyVendorPickupCancelled(vendorData.email, {
              pickupId,
              driverName: originalDriverName,
              reason,
              reschedulable: true,
            });
          }
        }
      } catch (emailError) {
        console.warn("⚠️ Email notification failed:", emailError);
        // Continue anyway - cancellation worked
      }

      console.log("✅ Pickup cancelled successfully");
      return true;
    } catch (error) {
      console.error("❌ Cancellation failed:", error);
      throw error;
    }
  };

  const completePickup = async (
    pickupId: string,
    actualBottleCount: number,
    proofPhoto: string,
  ) => {
    try {
      console.log("✅ Completing pickup:", pickupId);

      const pickup = pickups.find((p) => p.id === pickupId);
      if (!pickup) throw new Error("Pickup not found");

      await updatePickup(pickupId, {
        status: "completed",
        actualBottleCount,
        proofPhoto,
        completedAt: new Date().toISOString(),
      });

      // Notify vendor of pickup completion
      await PickupNotificationService.notifyVendorPickupCompleted(
        pickup.vendorId,
        pickupId,
        pickup.driverName || "Driver",
        actualBottleCount,
        pickup.bottleCount,
      );

      // Send email to vendor
      try {
        const vendorDoc = await getDoc(doc(db, "users", pickup.vendorId));

        if (vendorDoc.exists() && vendorDoc.data().email) {
          const vendorData = vendorDoc.data();

          await EmailService.notifyVendorPickupCompleted(vendorData.email, {
            pickupId,
            driverName: pickup.driverName || "Driver",
            completedAt: new Date().toISOString(),
            bottleCount: actualBottleCount,
            proofImages: proofPhoto ? [proofPhoto] : [],
          });

          console.log(
            "📧 Pickup completion email sent to vendor:",
            vendorData.email,
          );
        }
      } catch (emailError) {
        console.error("Error sending vendor completion email:", emailError);
      }

      console.log("✅ Pickup completed, vendor notified via push and email");
    } catch (error) {
      console.error("❌ Error completing pickup:", error);
      throw error;
    }
  };

  const value = {
    pickups,
    addPickup,
    updatePickup,
    getPickupsForVendor,
    getPickupsForDriver,
    getCancellationsForDriver,
    getAvailablePickups,
    getAllAvailablePickups,
    acceptPickup,
    hidePickup,
    unhidePickup,
    cancelPickup,
    completePickup,
    loading,
    error,
  };

  return (
    <FirebasePickupStoreContext.Provider value={value}>
      {children}
    </FirebasePickupStoreContext.Provider>
  );
};

export const useFirebasePickupStore = () => {
  const context = useContext(FirebasePickupStoreContext);
  if (context === undefined) {
    throw new Error(
      "useFirebasePickupStore must be used within a FirebasePickupStoreProvider",
    );
  }
  return context;
};
