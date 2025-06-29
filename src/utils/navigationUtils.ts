import { Alert, Linking, Platform } from "react-native";

export interface NavigationOptions {
  address: string;
  latitude?: number;
  longitude?: number;
  label?: string;
}

export class NavigationUtils {
  /**
   * Open navigation app with directions to the specified address
   */
  static async openNavigation(options: NavigationOptions): Promise<boolean> {
    const { address, latitude, longitude, label } = options;

    if (!address && (!latitude || !longitude)) {
      Alert.alert("Navigation Error", "No address or coordinates provided");
      return false;
    }

    try {
      // Try different navigation apps in order of preference
      const navigationUrls = this.getNavigationUrls(options);

      for (const { name, url } of navigationUrls) {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          return true;
        }
      }

      // If no specific apps are available, try web-based Google Maps
      const webUrl = this.getGoogleMapsWebUrl(options);
      await Linking.openURL(webUrl);
      return true;
    } catch (error) {
      console.error("Navigation error:", error);
      Alert.alert(
        "Navigation Error",
        "Could not open navigation app. Please check if you have a maps app installed.",
      );
      return false;
    }
  }

  /**
   * Get list of navigation URLs for different apps
   */
  private static getNavigationUrls(options: NavigationOptions) {
    const { address, latitude, longitude, label } = options;
    const encodedAddress = encodeURIComponent(address);
    const encodedLabel = label ? encodeURIComponent(label) : "";

    const urls = [];

    // Google Maps
    if (latitude && longitude) {
      urls.push({
        name: "Google Maps",
        url: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodedLabel}`,
      });
    } else {
      urls.push({
        name: "Google Maps",
        url: `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`,
      });
    }

    // Platform-specific apps
    if (Platform.OS === "ios") {
      // Apple Maps
      if (latitude && longitude) {
        urls.push({
          name: "Apple Maps",
          url: `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`,
        });
      } else {
        urls.push({
          name: "Apple Maps",
          url: `http://maps.apple.com/?daddr=${encodedAddress}&dirflg=d`,
        });
      }

      // Waze
      if (latitude && longitude) {
        urls.push({
          name: "Waze",
          url: `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`,
        });
      } else {
        urls.push({
          name: "Waze",
          url: `https://waze.com/ul?q=${encodedAddress}&navigate=yes`,
        });
      }
    } else {
      // Android-specific apps

      // Waze
      if (latitude && longitude) {
        urls.push({
          name: "Waze",
          url: `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`,
        });
      } else {
        urls.push({
          name: "Waze",
          url: `https://waze.com/ul?q=${encodedAddress}&navigate=yes`,
        });
      }

      // Android Google Maps
      if (latitude && longitude) {
        urls.push({
          name: "Google Maps",
          url: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedLabel})`,
        });
      }
    }

    return urls;
  }

  /**
   * Get web-based Google Maps URL as fallback
   */
  private static getGoogleMapsWebUrl(options: NavigationOptions): string {
    const { address, latitude, longitude } = options;
    const encodedAddress = encodeURIComponent(address);

    if (latitude && longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    } else {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    }
  }

  /**
   * Show navigation options to user
   */
  static showNavigationOptions(options: NavigationOptions): void {
    const { address, label } = options;
    const displayName = label || address;

    Alert.alert("Navigate to Location", `Open navigation to ${displayName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Navigate",
        onPress: () => this.openNavigation(options),
      },
    ]);
  }

  /**
   * Create route with multiple waypoints
   */
  static async openRouteWithWaypoints(
    waypoints: NavigationOptions[],
  ): Promise<boolean> {
    if (waypoints.length === 0) {
      Alert.alert("Route Error", "No waypoints provided");
      return false;
    }

    try {
      if (waypoints.length === 1) {
        return this.openNavigation(waypoints[0]);
      }

      // Create Google Maps URL with waypoints
      const origin = waypoints[0];
      const destination = waypoints[waypoints.length - 1];
      const intermediateWaypoints = waypoints.slice(1, -1);

      let url = "https://www.google.com/maps/dir/?api=1";

      // Add origin
      if (origin.latitude && origin.longitude) {
        url += `&origin=${origin.latitude},${origin.longitude}`;
      } else {
        url += `&origin=${encodeURIComponent(origin.address)}`;
      }

      // Add destination
      if (destination.latitude && destination.longitude) {
        url += `&destination=${destination.latitude},${destination.longitude}`;
      } else {
        url += `&destination=${encodeURIComponent(destination.address)}`;
      }

      // Add waypoints
      if (intermediateWaypoints.length > 0) {
        const waypointStrings = intermediateWaypoints.map((wp) => {
          if (wp.latitude && wp.longitude) {
            return `${wp.latitude},${wp.longitude}`;
          } else {
            return encodeURIComponent(wp.address);
          }
        });
        url += `&waypoints=${waypointStrings.join("|")}`;
      }

      await Linking.openURL(url);
      return true;
    } catch (error) {
      console.error("Route navigation error:", error);
      Alert.alert("Navigation Error", "Could not open route navigation");
      return false;
    }
  }
}
