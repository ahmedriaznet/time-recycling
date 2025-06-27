// Sample data for development and testing

export interface Pickup {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorAddress: string;
  driverId?: string;
  driverName?: string;
  scheduledDate: string;
  bottleCount: number;
  actualBottleCount?: number;
  status: "pending" | "assigned" | "in-progress" | "completed" | "cancelled";
  notes?: string;
  photos?: string[];
  createdAt: string;
  completedAt?: string;
}

export const sampleVendorPickups: Pickup[] = [
  {
    id: "1",
    vendorId: "vendor1",
    vendorName: "The Local Tavern",
    vendorAddress: "123 Main St, Downtown",
    scheduledDate: "2024-01-15T14:00:00Z",
    bottleCount: 25,
    status: "pending",
    notes: "Mixed bottles, mostly beer",
    createdAt: "2024-01-10T10:00:00Z",
  },
  {
    id: "2",
    vendorId: "vendor1",
    vendorName: "The Local Tavern",
    vendorAddress: "123 Main St, Downtown",
    driverId: "driver1",
    driverName: "John Smith",
    scheduledDate: "2024-01-10T11:00:00Z",
    bottleCount: 40,
    actualBottleCount: 38,
    status: "completed",
    notes: "Wine bottles",
    createdAt: "2024-01-08T09:00:00Z",
    completedAt: "2024-01-10T11:30:00Z",
  },
  {
    id: "3",
    vendorId: "vendor1",
    vendorName: "The Local Tavern",
    vendorAddress: "123 Main St, Downtown",
    driverId: "driver2",
    driverName: "Sarah Johnson",
    scheduledDate: "2024-01-12T16:00:00Z",
    bottleCount: 15,
    status: "assigned",
    notes: "Glass bottles only",
    createdAt: "2024-01-09T14:00:00Z",
  },
];

export const sampleDriverPickups: Pickup[] = [
  {
    id: "4",
    vendorId: "vendor2",
    vendorName: "Craft Beer Corner",
    vendorAddress: "456 Oak Ave, Midtown",
    driverId: "driver1",
    driverName: "John Smith",
    scheduledDate: "2024-01-15T10:00:00Z",
    bottleCount: 30,
    status: "assigned",
    notes: "Use back entrance, bottles in basement",
    createdAt: "2024-01-12T16:00:00Z",
  },
  {
    id: "5",
    vendorId: "vendor3",
    vendorName: "Wine & Dine",
    vendorAddress: "789 Pine St, Uptown",
    driverId: "driver1",
    driverName: "John Smith",
    scheduledDate: "2024-01-15T15:00:00Z",
    bottleCount: 20,
    status: "in-progress",
    notes: "Fragile wine bottles, handle with care",
    createdAt: "2024-01-13T11:00:00Z",
  },
  {
    id: "6",
    vendorId: "vendor4",
    vendorName: "Sports Bar Grill",
    vendorAddress: "321 Elm St, Westside",
    driverId: "driver1",
    driverName: "John Smith",
    scheduledDate: "2024-01-12T13:00:00Z",
    bottleCount: 50,
    actualBottleCount: 52,
    status: "completed",
    notes: "Large pickup, bring extra bags",
    createdAt: "2024-01-10T08:00:00Z",
    completedAt: "2024-01-12T13:45:00Z",
  },
];

// Utility functions
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const getStatusColor = (status: Pickup["status"]): string => {
  switch (status) {
    case "pending":
      return "#f59e0b"; // yellow
    case "assigned":
      return "#3b82f6"; // blue
    case "in-progress":
      return "#8b5cf6"; // purple
    case "completed":
      return "#22c55e"; // green
    case "cancelled":
      return "#ef4444"; // red
    default:
      return "#6b7280"; // gray
  }
};
