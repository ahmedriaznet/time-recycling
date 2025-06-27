import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNotification, Notification } from "../contexts/NotificationContext";

const { width } = Dimensions.get("window");

interface NotificationItemProps {
  notification: Notification;
  onHide: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onHide,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleHide = () => {
    // Slide out animation
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide(notification.id);
    });
  };

  const getNotificationStyle = () => {
    switch (notification.type) {
      case "success":
        return {
          backgroundColor: "#10B981",
          borderLeftColor: "#059669",
        };
      case "error":
        return {
          backgroundColor: "#EF4444",
          borderLeftColor: "#DC2626",
        };
      case "warning":
        return {
          backgroundColor: "#F59E0B",
          borderLeftColor: "#D97706",
        };
      case "info":
        return {
          backgroundColor: "#3B82F6",
          borderLeftColor: "#2563EB",
        };
      default:
        return {
          backgroundColor: "#6B7280",
          borderLeftColor: "#4B5563",
        };
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return "checkmark-circle";
      case "error":
        return "close-circle";
      case "warning":
        return "warning";
      case "info":
        return "information-circle";
      default:
        return "notifications";
    }
  };

  return (
    <Animated.View
      style={[
        styles.notificationContainer,
        getNotificationStyle(),
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.notificationContent}>
        <View style={styles.iconContainer}>
          <Ionicons name={getIcon()} size={24} color="white" />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{notification.title}</Text>
          {notification.message && (
            <Text style={styles.message}>{notification.message}</Text>
          )}
        </View>

        <TouchableOpacity onPress={handleHide} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export const NotificationSystem: React.FC = () => {
  const { notifications, hideNotification } = useNotification();
  const insets = useSafeAreaInsets();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { top: insets.top + 10 }]}>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onHide={hideNotification}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
  },
  notificationContainer: {
    width: width - 32,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  message: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
