export interface DriverInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  licenseNumber?: string;
  experience?: string;
  vehicleInfo?: string;
  avatar?: any;
  createdAt?: any;
  status?: string;
}

export interface DriverPublicInfo {
  id: string;
  name: string;
  avatar?: any;
}

export interface DriverVendorInfo {
  id: string;
  name: string;
  phone?: string; // Only when pickup is assigned
  avatar?: any;
  vehicleInfo?: string; // Only basic vehicle info for identification
}

export interface DriverAdminInfo extends DriverInfo {
  // Admins see all information including sensitive data
}

/**
 * Get driver information visible to vendors
 * Excludes sensitive information like license number
 */
export const getDriverInfoForVendor = (
  driver: DriverInfo,
  isAssignedPickup: boolean = false,
): DriverVendorInfo => {
  const vendorInfo: DriverVendorInfo = {
    id: driver.id,
    name: driver.name,
    avatar: driver.avatar,
  };

  // Only provide additional info if driver is assigned to vendor's pickup
  if (isAssignedPickup) {
    vendorInfo.phone = driver.phone;

    // Provide basic vehicle info for identification (without license plate)
    if (driver.vehicleInfo) {
      try {
        const vehicleData = JSON.parse(driver.vehicleInfo);
        vendorInfo.vehicleInfo = `${vehicleData.make} ${vehicleData.model} (${vehicleData.color})`;
      } catch {
        // If parsing fails, provide limited info
        vendorInfo.vehicleInfo = "Vehicle details available";
      }
    }
  }

  return vendorInfo;
};

/**
 * Get driver information visible to other drivers (public)
 * Very limited information for privacy
 */
export const getDriverPublicInfo = (driver: DriverInfo): DriverPublicInfo => {
  return {
    id: driver.id,
    name: driver.name,
    avatar: driver.avatar,
  };
};

/**
 * Get full driver information for admins
 * Includes all sensitive information
 */
export const getDriverInfoForAdmin = (driver: DriverInfo): DriverAdminInfo => {
  return driver as DriverAdminInfo;
};

/**
 * Check if user has permission to view sensitive driver information
 */
export const canViewSensitiveDriverInfo = (
  userRole: string,
  userId: string,
  driverId: string,
): boolean => {
  // Admin can see all sensitive info
  if (userRole === "admin") {
    return true;
  }

  // Driver can see their own sensitive info
  if (userRole === "driver" && userId === driverId) {
    return true;
  }

  // Vendors cannot see sensitive driver info
  return false;
};

/**
 * Sanitize driver data based on viewer's role and relationship
 */
export const sanitizeDriverInfo = (
  driver: DriverInfo,
  viewerRole: string,
  viewerId: string,
  isAssignedPickup: boolean = false,
): DriverPublicInfo | DriverVendorInfo | DriverAdminInfo => {
  if (viewerRole === "admin") {
    return getDriverInfoForAdmin(driver);
  }

  if (viewerRole === "vendor") {
    return getDriverInfoForVendor(driver, isAssignedPickup);
  }

  if (viewerRole === "driver" && viewerId === driver.id) {
    return getDriverInfoForAdmin(driver); // Drivers see their own full info
  }

  // Default to public info for any other case
  return getDriverPublicInfo(driver);
};
