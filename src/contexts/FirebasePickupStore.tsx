import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

export interface Pickup {
  id: string;
  vendorId: string;
  driverId?: string;
  driverName?: string;
  scheduledDate: string;
  bottleCount: number;
  status: "pending" | "assigned" | "in-progress" | "completed" | "cancelled";
  notes?: string;
  createdAt: string;
  completedAt?: string;
  address?: string;
  contactPhone?: string;
  urgentPickup?: boolean;
}

interface FirebasePickupStoreContextType {
  pickups: Pickup[];
  addPickup: (pickup: Omit<Pickup, "id" | "createdAt">) => Promise<void>;
  updatePickup: (id: string, updates: Partial<Pickup>) => Promise<void>;
  getPickupsForVendor: (vendorId: string) => Pickup[];
  getPickupsForDriver: (driverId: string) => Pickup[];
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
  const [loading, setLoading] = useState(false); // Don't block UI render
  const [error, setError] = useState<string | null>(null);

  // Set up real-time Firebase listener
  useEffect(() => {
    setupFirebaseListener();
  }, []);

  const setupFirebaseListener = () => {
    try {
      console.log("🔥 Setting up Firebase real-time listener for pickups...");

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
        console.log("🔥 Cleaning up Firebase listener");
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
      console.log("🔥 Adding pickup to Firebase...");

      const docRef = await addDoc(collection(db, "pickups"), {
        ...pickupData,
        createdAt: serverTimestamp(),
        scheduledDate: new Date(pickupData.scheduledDate),
      });

      console.log("✅ Pickup added to Firebase with ID:", docRef.id);
    } catch (error) {
      console.error("❌ Error adding pickup to Firebase:", error);
      setError(`Failed to add pickup: ${error.message}`);
      throw error;
    }
  };

  const updatePickup = async (id: string, updates: Partial<Pickup>) => {
    try {
      console.log("🔥 Updating pickup in Firebase...");

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

  const getPickupsForDriver = (driverId: string) => {
    return pickups.filter((pickup) => pickup.driverId === driverId);
  };

  const value = {
    pickups,
    addPickup,
    updatePickup,
    getPickupsForVendor,
    getPickupsForDriver,
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
