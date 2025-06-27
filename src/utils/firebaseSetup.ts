import {
  collection,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

// Pickup interface
export interface Pickup {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorAddress?: string;
  vendorPhone?: string;
  bottleCount: number;
  estimatedWeight?: string;
  scheduledDate: string;
  status: "pending" | "assigned" | "in-progress" | "completed" | "cancelled";
  driverId?: string;
  driverName?: string;
  notes?: string;
  completedAt?: string;
  createdAt: string;
}

// Utility functions
export const getPickupStats = (pickups: Pickup[]) => {
  return {
    total: pickups.length,
    pending: pickups.filter((p) => p.status === "pending").length,
    assigned: pickups.filter((p) => p.status === "assigned").length,
    completed: pickups.filter((p) => p.status === "completed").length,
  };
};

export const formatPickupDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "#f59e0b"; // amber
    case "assigned":
      return "#3b82f6"; // blue
    case "in-progress":
      return "#8b5cf6"; // purple
    case "completed":
      return "#10b981"; // green
    case "cancelled":
      return "#ef4444"; // red
    default:
      return "#6b7280"; // gray
  }
};

export const createSampleData = async () => {
  if (!db) {
    console.log("❌ Firestore not available, skipping sample data creation");
    return false;
  }

  try {
    console.log("🗃️ Creating sample data in Firestore...");

    // Sample pickup requests
    const samplePickups = [
      {
        vendorId: "vendor1",
        vendorName: "The Irish Pub",
        vendorAddress: "123 Main St, Downtown",
        vendorPhone: "+1 555-0123",
        bottleCount: 150,
        estimatedWeight: "75 lbs",
        scheduledDate: new Date("2024-01-20"),
        status: "pending",
        notes: "Please use back entrance. Bottles are in the storage room.",
        createdAt: serverTimestamp(),
      },
      {
        vendorId: "vendor2",
        vendorName: "Sunset Grill",
        vendorAddress: "456 Oak Ave, Midtown",
        vendorPhone: "+1 555-0456",
        bottleCount: 200,
        estimatedWeight: "100 lbs",
        scheduledDate: new Date("2024-01-21"),
        status: "assigned",
        driverId: "driver1",
        notes: "Bottles are sorted by color in separate bins.",
        createdAt: serverTimestamp(),
      },
    ];

    // Add sample pickups
    for (const pickup of samplePickups) {
      await addDoc(collection(db, "pickups"), pickup);
    }

    console.log("✅ Sample data created successfully");
    return true;
  } catch (error) {
    console.error("❌ Error creating sample data:", error);
    return false;
  }
};
